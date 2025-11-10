/**
 * Normalization utilities for vacation request fields
 * 
 * Ensures canonical labels are used throughout the application:
 * - Status: "Approved" (not "APPROVED" or "approved")
 * - Type: "Paid Vacation" (not "PAID_LEAVE" or "Paid Vacation")
 */

/**
 * Canonical status values
 */
export const CANONICAL_STATUS = {
  APPROVED: 'Approved',
  PENDING: 'Pending',
  DENIED: 'Denied',
} as const;

/**
 * Canonical type values
 */
export const CANONICAL_TYPE = {
  PAID_VACATION: 'Paid Vacation',
  UNPAID_LEAVE: 'Unpaid Leave',
  SICK_LEAVE: 'Sick Leave',
  OTHER: 'Other',
} as const;

/**
 * Normalize vacation status to canonical value
 * 
 * @param input - Status value to normalize
 * @returns Canonical status value (Approved, Pending, or Denied)
 */
export function normalizeVacationStatus(input: unknown): string {
  if (!input) return CANONICAL_STATUS.PENDING;
  
  const s = String(input).trim();
  const lower = s.toLowerCase();
  
  // Normalize to "Approved"
  if (lower === 'approved' || lower === 'approve' || lower === 'ok' || lower === 'accepted' || lower === 'validated') {
    return CANONICAL_STATUS.APPROVED;
  }
  
  // Normalize to "Denied"
  if (lower === 'denied' || lower === 'reject' || lower === 'rejected' || lower === 'declined') {
    return CANONICAL_STATUS.DENIED;
  }
  
  // Normalize to "Pending"
  if (lower === 'pending' || lower === 'waiting' || lower === 'submitted') {
    return CANONICAL_STATUS.PENDING;
  }
  
  // Default to Pending for unknown values
  return CANONICAL_STATUS.PENDING;
}

/**
 * Normalize vacation type to canonical value
 * 
 * @param input - Type value to normalize
 * @returns Canonical type value (Paid Vacation, Unpaid Leave, Sick Leave, or Other)
 */
export function normalizeVacationType(input: unknown): string {
  if (!input) return CANONICAL_TYPE.OTHER;
  
  const t = String(input).trim();
  const lower = t.toLowerCase();
  
  // Normalize to "Paid Vacation"
  if (
    lower === 'paid_leave' || 
    lower === 'paid leave' || 
    lower === 'paidvacation' || 
    lower === 'paid-vacation' ||
    lower === 'paid' ||
    lower === 'vacation' ||
    lower === 'paid_vacation' ||
    lower === 'paid vacation'
  ) {
    return CANONICAL_TYPE.PAID_VACATION;
  }
  
  // Normalize to "Unpaid Leave"
  if (
    lower === 'unpaid_leave' || 
    lower === 'unpaid leave' || 
    lower === 'unpaidleave' || 
    lower === 'unpaid-leave' ||
    lower === 'unpaid' ||
    lower === 'unpaid_vacation' ||
    lower === 'unpaid vacation'
  ) {
    return CANONICAL_TYPE.UNPAID_LEAVE;
  }
  
  // Normalize to "Sick Leave"
  if (
    lower === 'sick_leave' || 
    lower === 'sick leave' || 
    lower === 'sickleave' || 
    lower === 'sick-leave' ||
    lower === 'sick' ||
    lower === 'illness'
  ) {
    return CANONICAL_TYPE.SICK_LEAVE;
  }
  
  // Default to Other for unknown values
  return CANONICAL_TYPE.OTHER;
}

/**
 * Normalize vacation fields (status and type) to canonical values
 * 
 * @param input - Object with status and/or type fields
 * @returns Object with normalized status and type fields
 */
export function normalizeVacationFields(input: { status?: string | null; type?: string | null }): {
  status?: string;
  type?: string;
} {
  const normalized: { status?: string; type?: string } = {};
  
  if (input.status !== undefined && input.status !== null) {
    normalized.status = normalizeVacationStatus(input.status);
  }
  
  if (input.type !== undefined && input.type !== null) {
    normalized.type = normalizeVacationType(input.type);
  }
  
  return normalized;
}

/**
 * Get canonical label for display purposes
 * Maps legacy values to canonical labels for UI display
 */
export function getCanonicalLabel(value: string, field: 'status' | 'type'): string {
  if (field === 'status') {
    return normalizeVacationStatus(value);
  }
  return normalizeVacationType(value);
}

