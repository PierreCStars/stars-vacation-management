/**
 * Unified vacation request status types and utilities
 */

export type VacationRequestStatus = 'pending' | 'approved' | 'rejected';

export const VACATION_STATUS = {
  PENDING: 'pending' as const,
  APPROVED: 'approved' as const,
  REJECTED: 'rejected' as const,
} as const;

/**
 * Normalize status values to canonical format
 * Handles various formats: 'pending', 'PENDING', 'APPROVED', 'approved', etc.
 */
export function normalizeStatus(status: string | undefined | null): VacationRequestStatus {
  if (!status) return VACATION_STATUS.PENDING;
  
  const normalized = status.toLowerCase().trim();
  
  switch (normalized) {
    case 'pending':
      return VACATION_STATUS.PENDING;
    case 'approved':
      return VACATION_STATUS.APPROVED;
    case 'rejected':
    case 'denied':
      return VACATION_STATUS.REJECTED;
    default:
      console.warn(`[STATUS] Unknown status value: "${status}", defaulting to pending`);
      return VACATION_STATUS.PENDING;
  }
}

/**
 * Check if a status represents a pending request
 */
export function isPendingStatus(status: string | undefined | null): boolean {
  return normalizeStatus(status) === VACATION_STATUS.PENDING;
}

/**
 * Check if a status represents a reviewed request (approved or rejected)
 */
export function isReviewedStatus(status: string | undefined | null): boolean {
  const normalized = normalizeStatus(status);
  return normalized === VACATION_STATUS.APPROVED || normalized === VACATION_STATUS.REJECTED;
}
