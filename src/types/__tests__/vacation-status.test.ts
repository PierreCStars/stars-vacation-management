import { describe, it, expect } from 'vitest';
import { normalizeVacationStatus, isPendingStatus, isReviewedStatus, VACATION_STATUS } from '../vacation-status';

describe('vacation-status', () => {
  describe('normalizeVacationStatus', () => {
    it('should normalize pending status correctly', () => {
      expect(normalizeVacationStatus('pending')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus('PENDING')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus('Pending')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus('  pending  ')).toBe(VACATION_STATUS.PENDING);
    });

    it('should normalize approved status correctly', () => {
      expect(normalizeVacationStatus('approved')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeVacationStatus('APPROVED')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeVacationStatus('Approved')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeVacationStatus('  approved  ')).toBe(VACATION_STATUS.APPROVED);
    });

    it('should normalize denied status correctly', () => {
      expect(normalizeVacationStatus('denied')).toBe(VACATION_STATUS.DENIED);
      expect(normalizeVacationStatus('DENIED')).toBe(VACATION_STATUS.DENIED);
      expect(normalizeVacationStatus('Denied')).toBe(VACATION_STATUS.DENIED);
      expect(normalizeVacationStatus('rejected')).toBe(VACATION_STATUS.DENIED);
      expect(normalizeVacationStatus('REJECTED')).toBe(VACATION_STATUS.DENIED);
    });

    it('should handle null/undefined values', () => {
      expect(normalizeVacationStatus(null)).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus(undefined)).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus('')).toBe(VACATION_STATUS.PENDING);
    });

    it('should default to pending for unknown values', () => {
      expect(normalizeVacationStatus('unknown')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeVacationStatus('invalid')).toBe(VACATION_STATUS.PENDING);
    });
  });

  describe('isPendingStatus', () => {
    it('should correctly identify pending statuses', () => {
      expect(isPendingStatus('pending')).toBe(true);
      expect(isPendingStatus('PENDING')).toBe(true);
      expect(isPendingStatus('Pending')).toBe(true);
      expect(isPendingStatus(null)).toBe(true);
      expect(isPendingStatus(undefined)).toBe(true);
    });

    it('should correctly identify non-pending statuses', () => {
      expect(isPendingStatus('approved')).toBe(false);
      expect(isPendingStatus('APPROVED')).toBe(false);
      expect(isPendingStatus('rejected')).toBe(false);
      expect(isPendingStatus('REJECTED')).toBe(false);
    });
  });

  describe('isReviewedStatus', () => {
    it('should correctly identify reviewed statuses', () => {
      expect(isReviewedStatus('approved')).toBe(true);
      expect(isReviewedStatus('APPROVED')).toBe(true);
      expect(isReviewedStatus('rejected')).toBe(true);
      expect(isReviewedStatus('REJECTED')).toBe(true);
      expect(isReviewedStatus('denied')).toBe(true);
      expect(isReviewedStatus('DENIED')).toBe(true);
    });

    it('should correctly identify non-reviewed statuses', () => {
      expect(isReviewedStatus('pending')).toBe(false);
      expect(isReviewedStatus('PENDING')).toBe(false);
      expect(isReviewedStatus(null)).toBe(false);
      expect(isReviewedStatus(undefined)).toBe(false);
    });
  });
});
