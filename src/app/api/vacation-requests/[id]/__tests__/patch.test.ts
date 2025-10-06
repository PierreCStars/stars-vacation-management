import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '../route';
import { getServerSession } from 'next-auth/next';
import { getVacationRequestsService } from '@/lib/firebase';
import { syncEventForRequest, refreshCacheTags } from '@/lib/calendar/sync';
import { decideVacation } from '@/lib/vacation-orchestration';

// Mock dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getVacationRequestsService: vi.fn(),
}));

vi.mock('@/lib/calendar/sync', () => ({
  syncEventForRequest: vi.fn(),
  refreshCacheTags: vi.fn(),
}));

vi.mock('@/lib/vacation-orchestration', () => ({
  decideVacation: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe('PATCH /api/vacation-requests/[id]', () => {
  const mockSession = {
    user: {
      email: 'admin@stars.mc',
      name: 'Admin User',
    },
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
    status: 'pending',
  };

  const mockVacationService = {
    getVacationRequestById: vi.fn(),
    approveVacationRequest: vi.fn(),
    rejectVacationRequest: vi.fn(),
    updateVacationRequest: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue(mockSession as any);
    vi.mocked(getVacationRequestsService).mockReturnValue(mockVacationService as any);
    vi.mocked(syncEventForRequest).mockResolvedValue({ success: true, eventId: 'test-event-123' });
    vi.mocked(refreshCacheTags).mockResolvedValue();
    vi.mocked(decideVacation).mockResolvedValue(undefined);
  });

  it('should approve a vacation request successfully', async () => {
    mockVacationService.getVacationRequestById.mockResolvedValue(mockRequestData);
    mockVacationService.approveVacationRequest.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        reviewer: {
          id: 'admin@stars.mc',
          name: 'Admin User',
          email: 'admin@stars.mc',
        },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toBe('Vacation request approved successfully');
    expect(mockVacationService.approveVacationRequest).toHaveBeenCalledWith(
      'test-123',
      'Admin User',
      'admin@stars.mc',
      undefined
    );
    expect(syncEventForRequest).toHaveBeenCalledWith({
      id: 'test-request-123',
      userName: 'John Doe',
      userEmail: 'john@stars.mc',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      type: 'Full day',
      company: 'Stars',
      reason: 'Vacation',
      status: 'approved',
    });
    expect(refreshCacheTags).toHaveBeenCalled();
  });

  it('should reject a vacation request successfully', async () => {
    mockVacationService.getVacationRequestById.mockResolvedValue(mockRequestData);
    mockVacationService.rejectVacationRequest.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'rejected',
        reviewer: {
          id: 'admin@stars.mc',
          name: 'Admin User',
          email: 'admin@stars.mc',
        },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toBe('Vacation request rejected successfully');
    expect(mockVacationService.rejectVacationRequest).toHaveBeenCalledWith(
      'test-123',
      'Admin User',
      'admin@stars.mc',
      undefined
    );
    expect(syncEventForRequest).toHaveBeenCalledWith({
      id: 'test-request-123',
      userName: 'John Doe',
      userEmail: 'john@stars.mc',
      startDate: '2024-01-15',
      endDate: '2024-01-17',
      type: 'Full day',
      company: 'Stars',
      reason: 'Vacation',
      status: 'rejected',
    });
  });

  it('should return 401 for unauthorized requests', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 404 for non-existent requests', async () => {
    mockVacationService.getVacationRequestById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        reviewer: { id: 'admin@stars.mc', name: 'Admin', email: 'admin@stars.mc' },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Vacation request not found');
  });

  it('should handle calendar sync failures gracefully', async () => {
    mockVacationService.getVacationRequestById.mockResolvedValue(mockRequestData);
    mockVacationService.approveVacationRequest.mockResolvedValue(undefined);
    vi.mocked(syncEventForRequest).mockResolvedValue({ 
      success: false, 
      error: 'Calendar sync failed' 
    });

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        reviewer: { id: 'admin@stars.mc', name: 'Admin', email: 'admin@stars.mc' },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    // Should still succeed even if calendar sync fails
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('should handle cache invalidation failures gracefully', async () => {
    mockVacationService.getVacationRequestById.mockResolvedValue(mockRequestData);
    mockVacationService.approveVacationRequest.mockResolvedValue(undefined);
    vi.mocked(refreshCacheTags).mockRejectedValue(new Error('Cache invalidation failed'));

    const request = new NextRequest('http://localhost:3000/api/vacation-requests/test-123', {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'approved',
        reviewer: { id: 'admin@stars.mc', name: 'Admin', email: 'admin@stars.mc' },
      }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
    const data = await response.json();

    // Should still succeed even if cache invalidation fails
    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
