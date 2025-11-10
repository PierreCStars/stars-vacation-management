import { describe, it, expect } from 'vitest';
import { 
  normalizeVacationStatus, 
  normalizeVacationType, 
  normalizeVacationFields,
  CANONICAL_STATUS,
  CANONICAL_TYPE,
  getCanonicalLabel
} from '../normalize-vacation-fields';

describe('Normalize Vacation Fields', () => {
  describe('normalizeVacationStatus', () => {
    it('should normalize "APPROVED" to "Approved"', () => {
      expect(normalizeVacationStatus('APPROVED')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "approved" to "Approved"', () => {
      expect(normalizeVacationStatus('approved')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "Approved" to "Approved"', () => {
      expect(normalizeVacationStatus('Approved')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "  approved  " (with whitespace) to "Approved"', () => {
      expect(normalizeVacationStatus('  approved  ')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "approve" to "Approved"', () => {
      expect(normalizeVacationStatus('approve')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "ok" to "Approved"', () => {
      expect(normalizeVacationStatus('ok')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "accepted" to "Approved"', () => {
      expect(normalizeVacationStatus('accepted')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "validated" to "Approved"', () => {
      expect(normalizeVacationStatus('validated')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should normalize "denied" to "Denied"', () => {
      expect(normalizeVacationStatus('denied')).toBe(CANONICAL_STATUS.DENIED);
    });

    it('should normalize "DENIED" to "Denied"', () => {
      expect(normalizeVacationStatus('DENIED')).toBe(CANONICAL_STATUS.DENIED);
    });

    it('should normalize "rejected" to "Denied"', () => {
      expect(normalizeVacationStatus('rejected')).toBe(CANONICAL_STATUS.DENIED);
    });

    it('should normalize "pending" to "Pending"', () => {
      expect(normalizeVacationStatus('pending')).toBe(CANONICAL_STATUS.PENDING);
    });

    it('should handle null/undefined values', () => {
      expect(normalizeVacationStatus(null)).toBe(CANONICAL_STATUS.PENDING);
      expect(normalizeVacationStatus(undefined)).toBe(CANONICAL_STATUS.PENDING);
      expect(normalizeVacationStatus('')).toBe(CANONICAL_STATUS.PENDING);
    });

    it('should default to Pending for unknown values', () => {
      expect(normalizeVacationStatus('unknown')).toBe(CANONICAL_STATUS.PENDING);
    });
  });

  describe('normalizeVacationType', () => {
    it('should normalize "PAID_LEAVE" to "Paid Vacation"', () => {
      expect(normalizeVacationType('PAID_LEAVE')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "paid_leave" to "Paid Vacation"', () => {
      expect(normalizeVacationType('paid_leave')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "Paid Leave" to "Paid Vacation"', () => {
      expect(normalizeVacationType('Paid Leave')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "paid leave" to "Paid Vacation"', () => {
      expect(normalizeVacationType('paid leave')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "PaidVacation" to "Paid Vacation"', () => {
      expect(normalizeVacationType('PaidVacation')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "paid-vacation" to "Paid Vacation"', () => {
      expect(normalizeVacationType('paid-vacation')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "paid" to "Paid Vacation"', () => {
      expect(normalizeVacationType('paid')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "vacation" to "Paid Vacation"', () => {
      expect(normalizeVacationType('vacation')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "Paid Vacation" to "Paid Vacation"', () => {
      expect(normalizeVacationType('Paid Vacation')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize "UNPAID_LEAVE" to "Unpaid Leave"', () => {
      expect(normalizeVacationType('UNPAID_LEAVE')).toBe(CANONICAL_TYPE.UNPAID_LEAVE);
    });

    it('should normalize "unpaid leave" to "Unpaid Leave"', () => {
      expect(normalizeVacationType('unpaid leave')).toBe(CANONICAL_TYPE.UNPAID_LEAVE);
    });

    it('should normalize "SICK_LEAVE" to "Sick Leave"', () => {
      expect(normalizeVacationType('SICK_LEAVE')).toBe(CANONICAL_TYPE.SICK_LEAVE);
    });

    it('should handle null/undefined values', () => {
      expect(normalizeVacationType(null)).toBe(CANONICAL_TYPE.OTHER);
      expect(normalizeVacationType(undefined)).toBe(CANONICAL_TYPE.OTHER);
      expect(normalizeVacationType('')).toBe(CANONICAL_TYPE.OTHER);
    });

    it('should default to Other for unknown values', () => {
      expect(normalizeVacationType('unknown')).toBe(CANONICAL_TYPE.OTHER);
    });
  });

  describe('normalizeVacationFields', () => {
    it('should normalize both status and type', () => {
      const result = normalizeVacationFields({
        status: 'APPROVED',
        type: 'PAID_LEAVE'
      });
      
      expect(result.status).toBe(CANONICAL_STATUS.APPROVED);
      expect(result.type).toBe(CANONICAL_TYPE.PAID_VACATION);
    });

    it('should normalize only status when type is not provided', () => {
      const result = normalizeVacationFields({
        status: 'approved'
      });
      
      expect(result.status).toBe(CANONICAL_STATUS.APPROVED);
      expect(result.type).toBeUndefined();
    });

    it('should normalize only type when status is not provided', () => {
      const result = normalizeVacationFields({
        type: 'PAID_LEAVE'
      });
      
      expect(result.type).toBe(CANONICAL_TYPE.PAID_VACATION);
      expect(result.status).toBeUndefined();
    });

    it('should not include fields when null values are provided', () => {
      const result = normalizeVacationFields({
        status: null,
        type: null
      });
      
      // When null is explicitly provided, fields are not included in result
      expect(result.status).toBeUndefined();
      expect(result.type).toBeUndefined();
    });
  });

  describe('getCanonicalLabel', () => {
    it('should return canonical status label', () => {
      expect(getCanonicalLabel('APPROVED', 'status')).toBe(CANONICAL_STATUS.APPROVED);
      expect(getCanonicalLabel('approved', 'status')).toBe(CANONICAL_STATUS.APPROVED);
    });

    it('should return canonical type label', () => {
      expect(getCanonicalLabel('PAID_LEAVE', 'type')).toBe(CANONICAL_TYPE.PAID_VACATION);
      expect(getCanonicalLabel('paid_leave', 'type')).toBe(CANONICAL_TYPE.PAID_VACATION);
    });
  });
});

