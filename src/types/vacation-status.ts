/**
 * Unified vacation request status types and utilities
 */

export type VacationStatus = 'pending' | 'approved' | 'denied' | 'cancelled';

export const VACATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  CANCELLED: 'cancelled',
} as const;

export const VACATION_STATUS_VALUES: VacationStatus[] = [
  'pending', 'approved', 'denied', 'cancelled'
];

/** Normalize any input to our canonical VacationStatus */
export function normalizeVacationStatus(input: unknown): VacationStatus {
  if (!input) return 'pending';
  const s = String(input).toLowerCase().trim();
  if (s === 'approved' || s === 'approve' || s === 'ok' || s === 'accepted' || s === 'validated') return 'approved';
  if (s === 'denied' || s === 'reject' || s === 'rejected' || s === 'declined') return 'denied';
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s === 'withdrawn') return 'cancelled';
  return 'pending';
}

/** Type guard */
export function isVacationStatus(s: unknown): s is VacationStatus {
  return typeof s === 'string' && VACATION_STATUS_VALUES.includes(s as VacationStatus);
}

/**
 * Check if a status represents a pending request
 */
export function isPendingStatus(status: string | undefined | null): boolean {
  return normalizeVacationStatus(status) === VACATION_STATUS.PENDING;
}

/**
 * Check if a status represents a reviewed request (approved or denied)
 */
export function isReviewedStatus(status: string | undefined | null): boolean {
  const normalized = normalizeVacationStatus(status);
  return (
    normalized === VACATION_STATUS.APPROVED ||
    normalized === VACATION_STATUS.DENIED ||
    normalized === VACATION_STATUS.CANCELLED
  );
}

// Legacy exports for backward compatibility
export type VacationRequestStatus = VacationStatus;
export const normalizeStatus = normalizeVacationStatus;
