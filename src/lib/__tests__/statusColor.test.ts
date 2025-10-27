import { describe, it, expect } from 'vitest';
import { getStatusColor, detectConflictsForEmployee } from '../statusColor';

describe('statusColor utilities', () => {
  describe('getStatusColor', () => {
    it('should return green for approved status', () => {
      expect(getStatusColor('approved')).toBe('#5af542');
    });

    it('should return orange for pending status', () => {
      expect(getStatusColor('pending')).toBe('#f59b42');
    });

    it('should return red for requests with conflicts', () => {
      expect(getStatusColor('approved', true)).toBe('#c92b12');
      expect(getStatusColor('pending', true)).toBe('#c92b12');
    });

    it('should return gray for rejected status', () => {
      expect(getStatusColor('rejected')).toBe('#9ca3af');
    });

    it('should handle case insensitivity', () => {
      expect(getStatusColor('APPROVED')).toBe('#5af542');
      expect(getStatusColor('PENDING')).toBe('#f59b42');
    });
  });

  describe('detectConflictsForEmployee', () => {
    it('should detect overlapping requests for same employee', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: '2', userId: 'user1', startDate: '2025-12-03', endDate: '2025-12-08' }, // overlaps with id:1
        { id: '3', userId: 'user2', startDate: '2025-12-01', endDate: '2025-12-05' }, // different user
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(true);
    });

    it('should not detect conflicts for different employees', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: '2', userId: 'user2', startDate: '2025-12-03', endDate: '2025-12-08' }, // different user
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(false);
    });

    it('should not detect conflict with itself', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(false);
    });

    it('should detect conflicts with touching dates (overlapping)', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: '2', userId: 'user1', startDate: '2025-12-05', endDate: '2025-12-10' }, // touches, should conflict
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(true);
    });

    it('should handle multiple overlapping requests', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: '2', userId: 'user1', startDate: '2025-12-03', endDate: '2025-12-08' },
        { id: '3', userId: 'user1', startDate: '2025-12-06', endDate: '2025-12-12' }, // chain of overlaps
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(true);
    });

    it('should not detect conflicts with adjacent non-overlapping dates', () => {
      const allRequests = [
        { id: '1', userId: 'user1', startDate: '2025-12-01', endDate: '2025-12-05' },
        { id: '2', userId: 'user1', startDate: '2025-12-06', endDate: '2025-12-10' }, // day apart, no overlap
      ];

      expect(detectConflictsForEmployee('user1', '2025-12-01', '2025-12-05', allRequests)).toBe(false);
    });
  });
});

