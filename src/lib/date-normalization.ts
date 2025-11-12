/**
 * Date normalization utilities for all-day calendar events
 * 
 * Google Calendar uses exclusive end dates for all-day events:
 * - A one-day event on 2025-12-25 has: start.date='2025-12-25', end.date='2025-12-26'
 * - This means the event ends at the start of 2025-12-26 (exclusive)
 * 
 * Our app uses inclusive end dates for display:
 * - A one-day event should have: startDate='2025-12-25', endDate='2025-12-25'
 * 
 * This module provides utilities to convert between these formats.
 */

/**
 * Convert an exclusive end date (from Google Calendar) to an inclusive end date
 * For all-day events: if end.date is '2025-12-26' (exclusive), return '2025-12-25' (inclusive)
 * 
 * @param endDateExclusive - End date in YYYY-MM-DD format (exclusive)
 * @returns End date in YYYY-MM-DD format (inclusive), one day before
 */
export function convertExclusiveToInclusive(endDateExclusive: string): string {
  if (!endDateExclusive || !endDateExclusive.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return endDateExclusive;
  }
  
  const date = new Date(endDateExclusive + 'T00:00:00');
  date.setDate(date.getDate() - 1);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Normalize an all-day event from Google Calendar format to app format
 * Converts exclusive end dates to inclusive end dates
 * 
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDateExclusive - End date in YYYY-MM-DD format (exclusive, from Google Calendar)
 * @returns Object with startDate and endDate (both inclusive)
 */
export function normalizeAllDayEvent(
  startDate: string,
  endDateExclusive: string
): { startDate: string; endDate: string } {
  // If end date is missing or same as start, it's a single-day event
  if (!endDateExclusive || endDateExclusive === startDate) {
    return { startDate, endDate: startDate };
  }
  
  // Convert exclusive end to inclusive
  const endDateInclusive = convertExclusiveToInclusive(endDateExclusive);
  
  return { startDate, endDate: endDateInclusive };
}

/**
 * Check if a date falls within an all-day event range (inclusive on both ends)
 * This is the correct predicate for checking if an event should appear on a given day
 * 
 * @param day - The day to check (Date object at midnight local time)
 * @param startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns true if the day is within the event range
 */
export function isDayInAllDayEventRange(
  day: Date,
  startDate: string,
  endDate: string
): boolean {
  // Parse dates as local midnight to avoid timezone shifts
  const dayStr = formatDateOnly(day);
  return dayStr >= startDate && dayStr <= endDate;
}

/**
 * Format a Date object as YYYY-MM-DD string in local timezone
 */
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date string represents an all-day event (has date but no time)
 */
export function isAllDayEvent(start: { date?: string; dateTime?: string }): boolean {
  return !!start.date && !start.dateTime;
}

