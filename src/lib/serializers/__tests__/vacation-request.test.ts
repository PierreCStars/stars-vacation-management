import { describe, it, expect } from 'vitest';
import { serializeVacationRequestFor, serializeVacationRequestsFor } from '../vacation-request';
import { VacationRequest } from '@/types/vacation';

describe('Vacation Request Serializer', () => {
  const mockVacationRequest: VacationRequest = {
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

  describe('serializeVacationRequestFor', () => {
    it('should include reason field for admin users', () => {
      const result = serializeVacationRequestFor('pierre@stars.mc', mockVacationRequest);
      
      expect(result).toHaveProperty('reason');
      expect(result.reason).toBe('Personal vacation');
      expect(result.id).toBe('test-id');
      expect(result.userName).toBe('Test User');
    });

    it('should exclude reason field for non-admin users', () => {
      const result = serializeVacationRequestFor('user@stars.mc', mockVacationRequest);
      
      expect(result).not.toHaveProperty('reason');
      expect(result.id).toBe('test-id');
      expect(result.userName).toBe('Test User');
    });

    it('should handle null reason for admin users', () => {
      const requestWithoutReason = { ...mockVacationRequest, reason: null };
      const result = serializeVacationRequestFor('pierre@stars.mc', requestWithoutReason);
      
      expect(result).toHaveProperty('reason');
      expect(result.reason).toBeNull();
    });

    it('should handle undefined reason for admin users', () => {
      const requestWithoutReason = { ...mockVacationRequest, reason: undefined };
      const result = serializeVacationRequestFor('pierre@stars.mc', requestWithoutReason);
      
      expect(result).toHaveProperty('reason');
      expect(result.reason).toBeNull();
    });

    it('should handle null user email', () => {
      const result = serializeVacationRequestFor(null, mockVacationRequest);
      
      expect(result).not.toHaveProperty('reason');
    });

    it('should handle undefined user email', () => {
      const result = serializeVacationRequestFor(undefined, mockVacationRequest);
      
      expect(result).not.toHaveProperty('reason');
    });

    it('should preserve all other fields for both admin and non-admin', () => {
      const adminResult = serializeVacationRequestFor('pierre@stars.mc', mockVacationRequest);
      const nonAdminResult = serializeVacationRequestFor('user@stars.mc', mockVacationRequest);
      
      // Both should have all fields except reason
      expect(adminResult.id).toBe(nonAdminResult.id);
      expect(adminResult.userName).toBe(nonAdminResult.userName);
      expect(adminResult.startDate).toBe(nonAdminResult.startDate);
      expect(adminResult.endDate).toBe(nonAdminResult.endDate);
      expect(adminResult.company).toBe(nonAdminResult.company);
      expect(adminResult.type).toBe(nonAdminResult.type);
      expect(adminResult.status).toBe(nonAdminResult.status);
    });

    it('should be case-insensitive for admin email check', () => {
      const result1 = serializeVacationRequestFor('PIERRE@STARS.MC', mockVacationRequest);
      const result2 = serializeVacationRequestFor('Pierre@stars.mc', mockVacationRequest);
      
      expect(result1).toHaveProperty('reason');
      expect(result2).toHaveProperty('reason');
    });
  });

  describe('serializeVacationRequestsFor', () => {
    it('should serialize array of requests for admin users', () => {
      const requests = [mockVacationRequest, { ...mockVacationRequest, id: 'test-id-2' }];
      const results = serializeVacationRequestsFor('pierre@stars.mc', requests);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('reason');
      expect(results[1]).toHaveProperty('reason');
    });

    it('should serialize array of requests for non-admin users', () => {
      const requests = [mockVacationRequest, { ...mockVacationRequest, id: 'test-id-2' }];
      const results = serializeVacationRequestsFor('user@stars.mc', requests);
      
      expect(results).toHaveLength(2);
      expect(results[0]).not.toHaveProperty('reason');
      expect(results[1]).not.toHaveProperty('reason');
    });

    it('should handle empty array', () => {
      const results = serializeVacationRequestsFor('pierre@stars.mc', []);
      
      expect(results).toHaveLength(0);
    });
  });
});

