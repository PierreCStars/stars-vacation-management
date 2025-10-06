import { describe, it, expect } from 'vitest';
import { normalizeStatus, isPendingStatus, isReviewedStatus, VACATION_STATUS } from '../vacation-status';

describe('vacation-status', () => {
  describe('normalizeStatus', () => {
    it('should normalize pending status correctly', () => {
      expect(normalizeStatus('pending')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus('PENDING')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus('Pending')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus('  pending  ')).toBe(VACATION_STATUS.PENDING);
    });

    it('should normalize approved status correctly', () => {
      expect(normalizeStatus('approved')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeStatus('APPROVED')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeStatus('Approved')).toBe(VACATION_STATUS.APPROVED);
      expect(normalizeStatus('  approved  ')).toBe(VACATION_STATUS.APPROVED);
    });

    it('should normalize rejected status correctly', () => {
      expect(normalizeStatus('rejected')).toBe(VACATION_STATUS.REJECTED);
      expect(normalizeStatus('REJECTED')).toBe(VACATION_STATUS.REJECTED);
      expect(normalizeStatus('Rejected')).toBe(VACATION_STATUS.REJECTED);
      expect(normalizeStatus('denied')).toBe(VACATION_STATUS.REJECTED);
      expect(normalizeStatus('DENIED')).toBe(VACATION_STATUS.REJECTED);
    });

    it('should handle null/undefined values', () => {
      expect(normalizeStatus(null)).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus(undefined)).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus('')).toBe(VACATION_STATUS.PENDING);
    });

    it('should default to pending for unknown values', () => {
      expect(normalizeStatus('unknown')).toBe(VACATION_STATUS.PENDING);
      expect(normalizeStatus('invalid')).toBe(VACATION_STATUS.PENDING);
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
