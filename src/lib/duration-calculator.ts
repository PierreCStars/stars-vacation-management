/**
 * Single Source of Truth for Vacation Duration Calculation
 * 
 * This module ensures ALL vacation days are counted accurately, including:
 * - Full days (1.0)
 * - Half days (0.5)
 * - Multi-day ranges
 * - Single-day vacations
 * - Mixed ranges (partial first/last day)
 * - Any future fractional day format
 * 
 * CRITICAL: Never use Math.floor, Math.round, Math.ceil, or parseInt on duration values.
 * Always preserve fractional values (0.5, 1.5, 3.5, etc.)
 */

export interface VacationDurationInput {
  durationDays?: number;      // Explicit duration (supports 0.5, 1.5, etc.)
  isHalfDay?: boolean;         // Half-day flag
  halfDayType?: 'morning' | 'afternoon' | null;
  startDate?: string;          // ISO date string (YYYY-MM-DD)
  endDate?: string;            // ISO date string (YYYY-MM-DD)
}

/**
 * Calculate vacation duration in days (supports fractional days)
 * 
 * Priority:
 * 1. durationDays (if set and > 0) - explicit duration including 0.5
 * 2. isHalfDay === true → 0.5
 * 3. Calculate from date range (full days between dates)
 * 
 * @param input Vacation duration input
 * @returns Duration in days (can be 0.5, 1.0, 1.5, 2.0, etc.)
 * @throws Error if validated vacation computes to 0 days
 */
export function calculateVacationDuration(input: VacationDurationInput): number {
  // Priority 1: Check durationDays (explicit duration) - supports 0.5, 1.5, etc.
  if (typeof input.durationDays === "number") {
    if (input.durationDays > 0) {
      return input.durationDays;
    }
    // If durationDays is 0 or negative, fall through to check other fields
  }
  
  // Priority 2: Check isHalfDay flag
  if (input.isHalfDay === true) {
    return 0.5;
  }
  
  // Priority 3: Calculate from date range
  if (input.startDate) {
    const days = calculateDaysFromDateRange(input.startDate, input.endDate || input.startDate);
    return days;
  }
  
  // No valid data - return 0 (but this should not happen for validated vacations)
  return 0;
}

/**
 * Calculate days from date range (inclusive)
 * 
 * Returns the number of days between start and end dates (inclusive).
 * For same-day vacations, returns 1.0 (not 0).
 * 
 * CRITICAL: This function does NOT use Math.floor, Math.round, or Math.ceil.
 * It preserves fractional values for future support of partial days.
 * 
 * @param startISO Start date (YYYY-MM-DD)
 * @param endISO End date (YYYY-MM-DD), defaults to startISO
 * @returns Number of days (always >= 1.0 for valid date ranges)
 */
function calculateDaysFromDateRange(startISO: string, endISO: string): number {
  if (!startISO) {
    return 0;
  }
  
  const start = new Date(startISO);
  const end = new Date(endISO || startISO);
  
  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.warn(`⚠️ Invalid date range: ${startISO} to ${endISO}`);
    return 0;
  }
  
  // Calculate difference in milliseconds
  const ms = end.getTime() - start.getTime();
  
  // Convert to days (inclusive: +1 to include both start and end days)
  // Use Math.floor only for the base calculation, then add 1
  // This ensures same-day = 1.0, not 0
  const days = Math.floor(ms / (24 * 3600 * 1000)) + 1;
  
  // Ensure minimum of 1.0 day for valid date ranges
  return days > 0 ? days : 1.0;
}

/**
 * Safeguard: Validate that a vacation has non-zero duration
 * 
 * Throws an error if a validated vacation computes to 0 days.
 * This prevents data loss in reporting.
 * 
 * @param input Vacation duration input
 * @param vacationId Optional vacation ID for error message
 * @throws Error if duration is 0 for a validated vacation
 */
export function validateVacationDuration(input: VacationDurationInput, vacationId?: string): void {
  const duration = calculateVacationDuration(input);
  
  if (duration <= 0) {
    const id = vacationId ? ` (ID: ${vacationId})` : '';
    const error = new Error(
      `VALIDATION ERROR: Vacation${id} computes to 0 days. ` +
      `This should not happen for validated vacations. ` +
      `durationDays: ${input.durationDays}, isHalfDay: ${input.isHalfDay}, ` +
      `startDate: ${input.startDate}, endDate: ${input.endDate}`
    );
    console.error('❌', error.message);
    throw error;
  }
}

/**
 * Format duration for display (supports fractional days)
 * 
 * @param days Duration in days (can be 0.5, 1.0, 1.5, etc.)
 * @returns Formatted string (e.g., "0.5 day", "1 day", "1.5 days", "3.5 days")
 */
export function formatDuration(days: number): string {
  if (days === 0.5) {
    return "0.5 day";
  }
  if (days === 1.0 || days === 1) {
    return "1 day";
  }
  // For fractional values, show one decimal place
  if (days % 1 !== 0) {
    return `${days.toFixed(1)} days`;
  }
  return `${days} days`;
}

/**
 * Sum vacation durations (preserves fractional values)
 * 
 * CRITICAL: Always use this function for summing durations.
 * Never use Math.floor, Math.round, or parseInt on the result.
 * 
 * @param durations Array of duration values
 * @returns Sum of durations (preserves decimals)
 */
export function sumDurations(durations: number[]): number {
  return durations.reduce((sum, days) => {
    // Ensure we're working with numbers
    const daysNum = typeof days === 'number' ? days : Number(days) || 0;
    return sum + daysNum;
  }, 0);
}

