import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { mapFromFirestore } from '@/lib/requests/mapFromFirestore';

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getFirebaseAdmin: vi.fn(),
}));

vi.mock('@/lib/requests/mapFromFirestore', () => ({
  mapFromFirestore: vi.fn((id, data) => ({ id, ...data })),
}));

vi.mock('@/lib/vacation-orchestration', () => ({
  submitVacation: vi.fn(),
}));

describe('Vacation Requests API - Reason Redaction', () => {
  const mockVacationRequest = {
    id: 'test-id',
    userId: 'user@stars.mc',
    userEmail: 'user@stars.mc',
    userName: 'Test User',
    startDate: '2025-01-01',
    endDate: '2025-01-05',
    reason: 'Personal vacation',
    company: 'STARS',
    type: 'Vacation',
    status: 'approved',
    createdAt: '2025-01-01T00:00:00Z',
    durationDays: 5,
  };

  const mockDb = {
    collection: vi.fn(() => ({
      get: vi.fn(),
      add: vi.fn(),
    })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getFirebaseAdmin as any).mockReturnValue({ db: mockDb, error: null });
  });

  describe('GET /api/vacation-requests', () => {
    it('should include reason field for admin users', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'test-id',
            data: () => mockVacationRequest,
          },
        ],
      };

      (mockDb.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      (getServerSession as any).mockResolvedValue({
        user: { email: 'pierre@stars.mc' },
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toBeInstanceOf(Array);
      expect(data[0]).toHaveProperty('reason');
      expect(data[0].reason).toBe('Personal vacation');
    });

    it('should exclude reason field for non-admin users', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'test-id',
            data: () => mockVacationRequest,
          },
        ],
      };

      (mockDb.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      (getServerSession as any).mockResolvedValue({
        user: { email: 'user@stars.mc' },
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toBeInstanceOf(Array);
      expect(data[0]).not.toHaveProperty('reason');
    });

    it('should handle null session (unauthenticated)', async () => {
      const mockSnapshot = {
        docs: [
          {
            id: 'test-id',
            data: () => mockVacationRequest,
          },
        ],
      };

      (mockDb.collection as any).mockReturnValue({
        get: vi.fn().mockResolvedValue(mockSnapshot),
      });

      (getServerSession as any).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(data).toBeInstanceOf(Array);
      expect(data[0]).not.toHaveProperty('reason');
    });
  });

  describe('POST /api/vacation-requests', () => {
    it('should include reason in response for admin users', async () => {
      const mockDocRef = {
        id: 'new-id',
        get: vi.fn().mockResolvedValue({
          data: () => mockVacationRequest,
        }),
      };

      (mockDb.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue(mockDocRef),
      });

      (getServerSession as any).mockResolvedValue({
        user: { email: 'pierre@stars.mc', name: 'Pierre' },
      });

      const request = new NextRequest('http://localhost/api/vacation-requests', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          reason: 'Personal vacation',
          company: 'STARS',
          type: 'Vacation',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.request).toHaveProperty('reason');
      expect(data.request.reason).toBe('Personal vacation');
    });

    it('should exclude reason in response for non-admin users', async () => {
      const mockDocRef = {
        id: 'new-id',
        get: vi.fn().mockResolvedValue({
          data: () => mockVacationRequest,
        }),
      };

      (mockDb.collection as any).mockReturnValue({
        add: vi.fn().mockResolvedValue(mockDocRef),
      });

      (getServerSession as any).mockResolvedValue({
        user: { email: 'user@stars.mc', name: 'User' },
      });

      const request = new NextRequest('http://localhost/api/vacation-requests', {
        method: 'POST',
        body: JSON.stringify({
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          reason: 'Personal vacation',
          company: 'STARS',
          type: 'Vacation',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.request).not.toHaveProperty('reason');
    });
  });
});

