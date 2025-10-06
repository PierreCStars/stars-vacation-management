import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '../route';
import { absoluteUrl } from '@/lib/urls';

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/firebase', () => ({
  getVacationRequestsService: vi.fn(() => ({
    getVacationRequestById: vi.fn(),
    approveVacationRequest: vi.fn(),
    rejectVacationRequest: vi.fn()
  }))
}));

vi.mock('@/lib/calendar/sync', () => ({
  syncEventForRequest: vi.fn(() => Promise.resolve({ success: true, eventId: 'test-event-id' })),
  refreshCacheTags: vi.fn(() => Promise.resolve())
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn()
}));

describe('/api/vacation-requests/[id] PATCH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should approve a vacation request successfully', async () => {
    const { getServerSession } = await import('next-auth/next');
    const { getVacationRequestsService } = await import('@/lib/firebase');
    
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@stars.mc', name: 'Admin User' }
    } as any);

    // Mock vacation service
    const mockService = {
      getVacationRequestById: vi.fn().mockResolvedValue({
        id: 'test-123',
        userName: 'Test User',
        userEmail: 'test@stars.mc',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        type: 'VACATION',
        company: 'STARS_MC',
        reason: 'Test vacation'
      }),
      approveVacationRequest: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(getVacationRequestsService).mockReturnValue(mockService);

      const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        reviewer: {
          id: 'admin@stars.mc',
          name: 'Admin User',
          email: 'admin@stars.mc'
        }
      })
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.request.status).toBe('approved');
    expect(mockService.approveVacationRequest).toHaveBeenCalledWith(
      'test-123',
      'Admin User',
      'admin@stars.mc',
      undefined
    );
  });

  it('should reject a vacation request successfully', async () => {
    const { getServerSession } = await import('next-auth/next');
    const { getVacationRequestsService } = await import('@/lib/firebase');
    
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@stars.mc', name: 'Admin User' }
    } as any);

    // Mock vacation service
    const mockService = {
      getVacationRequestById: vi.fn().mockResolvedValue({
        id: 'test-123',
        userName: 'Test User',
        userEmail: 'test@stars.mc',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        type: 'VACATION',
        company: 'STARS_MC',
        reason: 'Test vacation'
      }),
      rejectVacationRequest: vi.fn().mockResolvedValue(undefined)
    };
    vi.mocked(getVacationRequestsService).mockReturnValue(mockService);

      const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'rejected',
        reviewer: {
          id: 'admin@stars.mc',
          name: 'Admin User',
          email: 'admin@stars.mc'
        }
      })
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.request.status).toBe('rejected');
    expect(mockService.rejectVacationRequest).toHaveBeenCalledWith(
      'test-123',
      'Admin User',
      'admin@stars.mc',
      undefined
    );
  });

  it('should return 401 for unauthorized requests', async () => {
    const { getServerSession } = await import('next-auth/next');
    
    // Mock no session
    vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' })
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 400 for invalid update requests', async () => {
    const { getServerSession } = await import('next-auth/next');
    
    // Mock session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'admin@stars.mc', name: 'Admin User' }
    } as any);

      const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({ invalidField: 'value' })
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid update request');
  });
});