import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../check-pending-requests/route';

// Mock Firebase Admin
vi.mock('@/lib/firebaseAdmin', () => ({
  getFirebaseAdminFirestore: vi.fn(),
  isFirebaseAdminAvailable: vi.fn(() => true)
}));

// Mock mailer
vi.mock('@/lib/mailer', () => ({
  sendAdminNotification: vi.fn()
}));

// Mock environment variables
Object.defineProperty(process, 'env', {
  value: {
    NEXTAUTH_URL: 'https://test.example.com'
  },
  writable: true
});

describe('Check Pending Requests Cron', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success when no overdue requests are found', async () => {
    const { getFirebaseAdminFirestore } = await import('@/lib/firebaseAdmin');
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: []
          })
        })
      })
    };
    
    (getFirebaseAdminFirestore as any).mockReturnValue(mockDb);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(0);
    expect(data.message).toBe('No overdue requests found');
  });

  it('should find and process overdue requests', async () => {
    const { getFirebaseAdminFirestore } = await import('@/lib/firebaseAdmin');
    const { sendAdminNotification } = await import('@/lib/mailer');
    
    // Create mock overdue request (4 days old)
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const mockOverdueRequest = {
      id: 'test-request-1',
      data: () => ({
        userName: 'John Doe',
        userEmail: 'test@example.com',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        reason: 'Vacation',
        company: 'Test Company',
        status: 'pending',
        createdAt: {
          toDate: () => fourDaysAgo
        }
      })
    };

    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [mockOverdueRequest]
          })
        })
      })
    };
    
    (getFirebaseAdminFirestore as any).mockReturnValue(mockDb);
    (sendAdminNotification as any).mockResolvedValue(undefined);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(1);
    expect(data.requests).toHaveLength(1);
    expect(data.requests[0].id).toBe('test-request-1');
    expect(data.requests[0].userName).toBe('John Doe');
    expect(data.requests[0].daysOverdue).toBeGreaterThanOrEqual(3);
    
    // Verify email was sent
    expect(sendAdminNotification).toHaveBeenCalledTimes(1);
    const emailCall = (sendAdminNotification as any).mock.calls[0][0];
    expect(emailCall.subject).toContain('Vacation request pending for review');
    expect(emailCall.html).toContain('John Doe');
    expect(emailCall.html).toContain('/admin/vacation-requests/test-request-1');
  });

  it('should handle Firebase Admin not available', async () => {
    const { isFirebaseAdminAvailable } = await import('@/lib/firebaseAdmin');
    (isFirebaseAdminAvailable as any).mockReturnValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(0);
  });

  it('should handle Firebase query errors gracefully', async () => {
    const { getFirebaseAdminFirestore } = await import('@/lib/firebaseAdmin');
    
    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockRejectedValue(new Error('Firebase connection failed'))
        })
      })
    };
    
    (getFirebaseAdminFirestore as any).mockReturnValue(mockDb);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(0);
  });

  it('should handle email sending errors gracefully', async () => {
    const { getFirebaseAdminFirestore, isFirebaseAdminAvailable } = await import('@/lib/firebaseAdmin');
    const { sendAdminNotification } = await import('@/lib/mailer');
    
    // Ensure Firebase Admin is available
    (isFirebaseAdminAvailable as any).mockReturnValue(true);
    
    // Create mock overdue request
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    
    const mockOverdueRequest = {
      id: 'test-request-1',
      data: () => ({
        userName: 'John Doe',
        userEmail: 'test@example.com',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        reason: 'Vacation',
        company: 'Test Company',
        status: 'pending',
        createdAt: {
          toDate: () => fourDaysAgo
        }
      })
    };

    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: [mockOverdueRequest]
          })
        })
      })
    };
    
    (getFirebaseAdminFirestore as any).mockReturnValue(mockDb);
    (sendAdminNotification as any).mockRejectedValue(new Error('Email sending failed'));

    const response = await GET();
    const data = await response.json();

    // Should still return success even if email fails
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(1);
  });

  it('should correctly identify requests older than 3 days', async () => {
    const { getFirebaseAdminFirestore, isFirebaseAdminAvailable } = await import('@/lib/firebaseAdmin');
    
    // Ensure Firebase Admin is available
    (isFirebaseAdminAvailable as any).mockReturnValue(true);
    
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    const mockRequests = [
      {
        id: 'recent-request',
        data: () => ({
          userName: 'Recent User',
          userEmail: 'recent@example.com',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          company: 'Test Company',
          status: 'pending',
          createdAt: { toDate: () => twoDaysAgo }
        })
      },
      {
        id: 'overdue-request-1',
        data: () => ({
          userName: 'Overdue User 1',
          userEmail: 'overdue1@example.com',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          company: 'Test Company',
          status: 'pending',
          createdAt: { toDate: () => fourDaysAgo }
        })
      },
      {
        id: 'overdue-request-2',
        data: () => ({
          userName: 'Overdue User 2',
          userEmail: 'overdue2@example.com',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          company: 'Test Company',
          status: 'pending',
          createdAt: { toDate: () => sixDaysAgo }
        })
      }
    ];

    const mockDb = {
      collection: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: vi.fn().mockResolvedValue({
            docs: mockRequests
          })
        })
      })
    };
    
    (getFirebaseAdminFirestore as any).mockReturnValue(mockDb);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.overdueCount).toBe(2); // Only 4 and 6 day old requests should be overdue
    expect(data.requests.map((r: any) => r.id)).toEqual(['overdue-request-1', 'overdue-request-2']);
  });
});
