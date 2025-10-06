import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ensureEventForRequest, deleteEventForRequest, syncEventForRequest } from '../sync';
import { addVacationToCalendar, deleteVacationFromCalendar } from '@/lib/google-calendar';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

// Mock dependencies
vi.mock('@/lib/google-calendar', () => ({
  addVacationToCalendar: vi.fn(),
  deleteVacationFromCalendar: vi.fn(),
}));

vi.mock('@/lib/firebaseAdmin', () => ({
  getFirebaseAdmin: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe('Calendar Sync Service', () => {
  const mockDb = {
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        update: vi.fn(),
      })),
    })),
  };

  const mockRequestData = {
    id: 'test-request-123',
    userName: 'John Doe',
    userEmail: 'john@stars.mc',
    startDate: '2024-01-15',
    endDate: '2024-01-17',
    type: 'Full day',
    company: 'Stars',
    reason: 'Vacation',
    status: 'approved' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getFirebaseAdmin).mockReturnValue({
      app: null,
      db: mockDb as any,
      error: null,
    });
  });

  describe('ensureEventForRequest', () => {
    it('should skip non-approved requests', async () => {
      const pendingRequest = { ...mockRequestData, status: 'pending' as const };
      
      const result = await ensureEventForRequest(mockDb as any, pendingRequest);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBeUndefined();
      expect(addVacationToCalendar).not.toHaveBeenCalled();
    });

    it('should return existing event ID if already synced', async () => {
      const existingEventId = 'existing-event-123';
      const docRef = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ calendarEventId: existingEventId })
        })
      };
      mockDb.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue(docRef)
      });

      const result = await ensureEventForRequest(mockDb as any, mockRequestData);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(existingEventId);
      expect(addVacationToCalendar).not.toHaveBeenCalled();
    });

    it('should create new event and store ID for approved requests', async () => {
      const newEventId = 'new-event-123';
      const docRef = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ calendarEventId: null })
        }),
        update: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue(docRef)
      });
      vi.mocked(addVacationToCalendar).mockResolvedValue(newEventId);

      const result = await ensureEventForRequest(mockDb as any, mockRequestData);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBe(newEventId);
      expect(addVacationToCalendar).toHaveBeenCalledWith({
        userName: mockRequestData.userName,
        startDate: mockRequestData.startDate,
        endDate: mockRequestData.endDate,
        type: mockRequestData.type,
        company: mockRequestData.company,
        reason: mockRequestData.reason,
      });
      expect(docRef.update).toHaveBeenCalledWith({
        calendarEventId: newEventId,
        calendarSyncedAt: expect.any(String),
      });
    });

    it('should handle errors gracefully', async () => {
      const docRef = {
        get: vi.fn().mockRejectedValue(new Error('Firestore error'))
      };
      mockDb.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue(docRef)
      });

      const result = await ensureEventForRequest(mockDb as any, mockRequestData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firestore error');
    });
  });

  describe('deleteEventForRequest', () => {
    it('should skip if no event ID exists', async () => {
      const docRef = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ calendarEventId: null })
        })
      };
      mockDb.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue(docRef)
      });

      const result = await deleteEventForRequest(mockDb as any, mockRequestData);
      
      expect(result.success).toBe(true);
      expect(deleteVacationFromCalendar).not.toHaveBeenCalled();
    });

    it('should delete existing event and clear ID', async () => {
      const existingEventId = 'existing-event-123';
      const docRef = {
        get: vi.fn().mockResolvedValue({
          data: () => ({ calendarEventId: existingEventId })
        }),
        update: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.collection.mockReturnValue({
        doc: vi.fn().mockReturnValue(docRef)
      });
      vi.mocked(deleteVacationFromCalendar).mockResolvedValue(undefined);

      const result = await deleteEventForRequest(mockDb as any, mockRequestData);
      
      expect(result.success).toBe(true);
      expect(deleteVacationFromCalendar).toHaveBeenCalledWith(existingEventId);
      expect(docRef.update).toHaveBeenCalledWith({
        calendarEventId: null,
        calendarSyncedAt: expect.any(String),
      });
    });
  });

  describe('syncEventForRequest', () => {
    it('should sync approved requests successfully', async () => {
      const result = await syncEventForRequest(mockRequestData);
      
      expect(result.success).toBe(true);
      expect(result.eventId).toBe('existing-event-123');
    });

    it('should sync rejected requests successfully', async () => {
      const rejectedRequest = { ...mockRequestData, status: 'rejected' as const };
      const result = await syncEventForRequest(rejectedRequest);
      
      expect(result.success).toBe(true);
    });

    it('should handle Firebase Admin unavailable', async () => {
      vi.mocked(getFirebaseAdmin).mockReturnValue({
        app: null,
        db: null,
        error: 'Firebase Admin not available',
      });

      const result = await syncEventForRequest(mockRequestData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Firebase Admin not available');
    });
  });
});
