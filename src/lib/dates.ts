/**
 * Date utility functions for safe local timezone parsing
 * Prevents timezone bugs when parsing date-only strings
 */

/**
 * Parse an ISO date string (YYYY-MM-DD) as a local date at midnight
 * This prevents timezone shifts when parsing date-only strings
 * 
 * @param isoString - ISO date string like "2025-12-25"
 * @returns Date object at 00:00:00 local time
 */
export function parseLocalDate(isoString: string): Date {
  // For date-only strings (YYYY-MM-DD), we need to parse as local time
  // Using 'T00:00:00' ensures we get midnight in local timezone, not UTC
  const date = new Date(isoString + 'T00:00:00');
  
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${isoString}`);
  }
  
  return date;
}

/**
 * Parse an ISO date string with explicit timezone handling
 * Used for parsing dates from backend/API
 */
export function parseISODate(isoString: string): Date {
  // If it's a full ISO string with time, use standard parsing
  if (isoString.includes('T') || isoString.includes(' ')) {
    return new Date(isoString);
  }
  
  // If it's date-only, treat as local midnight
  return parseLocalDate(isoString);
}

/**
 * Format date as ISO string (YYYY-MM-DD) in local timezone
 */
export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date falls within a date range (inclusive on both ends)
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

/**
 * Check if two date ranges overlap
 * Ranges are inclusive on both ends
 */
export function doRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return start1 <= end2 && start2 <= end1;
}

/**
 * Get the first day of week for a given month
 * Returns a Date object at midnight local time
 * @param year - Full year (e.g., 2025)
 * @param month - Month index (0-11)
 * @param startOfWeek - Day of week to start on (0=Sunday, 1=Monday, etc.)
 */
export function getFirstDayOfCalendarGrid(year: number, month: number, startOfWeek: number = 0): Date {
  const firstDayOfMonth = new Date(year, month, 1);
  
  if (startOfWeek === 0) {
    // Sunday start
    return new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth(), firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
  }
  
  // For Monday start (or any other day)
  // getDay() returns 0 for Sunday, 1 for Monday, etc.
  // To convert to Monday=0, we use: (getDay() + 6) % 7
  // Then subtract that from the first day
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
  const daysToSubtract = firstDayOfWeek;
  
  const firstCalendarDay = new Date(firstDayOfMonth);
  firstCalendarDay.setDate(firstCalendarDay.getDate() - daysToSubtract);
  
  return firstCalendarDay;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return formatISODate(date) === formatISODate(today);
}

/**
 * Check if a date is in the current month
 */
export function isInMonth(date: Date, year: number, month: number): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

