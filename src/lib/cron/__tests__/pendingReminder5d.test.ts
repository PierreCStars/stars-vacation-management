/**
 * Unit tests for 5-day pending reminder functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findPendingRequestsForReminder, runPendingReminder5d } from '../pendingReminder5d';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Mock dependencies
vi.mock('@/lib/firebaseAdmin');
vi.mock('@/lib/mailer');
vi.mock('@/lib/urls');

describe('findPendingRequestsForReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return only pending requests not reminded in last 5 days', async () => {
    const mockDb = {
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(() => ({
            docs: [
              {
                id: 'req1',
                data: () => ({
                  status: 'pending',
                  userName: 'John Doe',
                  userEmail: 'john@example.com',
                  startDate: '2025-01-15',
                  endDate: '2025-01-20',
                  company: 'Stars MC',
                  createdAt: { toDate: () => new Date('2025-01-01') }
                })
              },
              {
                id: 'req2',
                data: () => ({
                  status: 'pending',
                  userName: 'Jane Smith',
                  userEmail: 'jane@example.com',
                  startDate: '2025-01-16',
                  endDate: '2025-01-21',
                  company: 'Stars Yachting',
                  lastRemindedAt: { toDate: () => new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // 2 days ago
                  createdAt: { toDate: () => new Date('2025-01-01') }
                })
              },
              {
                id: 'req3',
                data: () => ({
                  status: 'pending',
                  userName: 'Bob Wilson',
                  userEmail: 'bob@example.com',
                  startDate: '2025-01-17',
                  endDate: '2025-01-22',
                  company: 'Stars Real Estate',
                  lastRemindedAt: { toDate: () => new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) }, // 6 days ago
                  createdAt: { toDate: () => new Date('2025-01-01') }
                })
              }
            ]
          }))
        }))
      }))
    };

    vi.mocked(getFirebaseAdmin).mockReturnValue({
      db: mockDb as any,
      error: null
    });

    const requests = await findPendingRequestsForReminder();

    // Should include req1 (no lastRemindedAt) and req3 (reminded 6 days ago)
    // Should exclude req2 (reminded 2 days ago)
    expect(requests).toHaveLength(2);
    expect(requests.map(r => r.id)).toContain('req1');
    expect(requests.map(r => r.id)).toContain('req3');
    expect(requests.map(r => r.id)).not.toContain('req2');
  });

  it('should exclude approved/denied requests', async () => {
    // Mock the where query to return empty results for non-pending statuses
    const mockWhere = vi.fn((field, operator, values) => {
      // Simulate Firestore 'in' query - only return docs with status in the values array
      return {
        get: vi.fn(() => ({
          docs: [] // Empty because 'approved' is not in ['pending', 'PENDING', 'Pending']
        }))
      };
    });

    const mockDb = {
      collection: vi.fn(() => ({
        where: mockWhere
      }))
    };

    vi.mocked(getFirebaseAdmin).mockReturnValue({
      db: mockDb as any,
      error: null
    });

    const requests = await findPendingRequestsForReminder();
    expect(requests).toHaveLength(0);
    expect(mockWhere).toHaveBeenCalledWith('status', 'in', ['pending', 'PENDING', 'Pending']);
  });
});

describe('runPendingReminder5d', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REMINDER_ENABLED = 'true';
  });

  it('should skip when REMINDER_ENABLED is false', async () => {
    process.env.REMINDER_ENABLED = 'false';

    const result = await runPendingReminder5d();

    expect(result.success).toBe(true);
    expect(result.included).toBe(0);
    expect(result.notified).toBe(0);
  });

  it('should return success when no pending requests', async () => {
    const mockDb = {
      collection: vi.fn(() => ({
        where: vi.fn(() => ({
          get: vi.fn(() => ({
            docs: [],
            size: 0
          }))
        }))
      }))
    };

    vi.mocked(getFirebaseAdmin).mockReturnValue({
      db: mockDb as any,
      error: null
    });

    const result = await runPendingReminder5d();

    expect(result.success).toBe(true);
    expect(result.included).toBe(0);
    expect(result.notified).toBe(0);
  });
});

