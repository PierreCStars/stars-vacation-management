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
 *
 * RÈGLE MÉTIER (2026-06-12) : les jours de congés décomptés sont les jours
 * OUVRÉS — les samedis, dimanches et jours fériés monégasques ne sont PAS
 * comptés. Voir countWorkingDays().
 */

import { getMonacoHolidays } from './monaco-holidays';

/**
 * Compte les jours ouvrés (inclus) entre deux dates ISO : exclut samedi,
 * dimanche et jours fériés monégasques. Calcul jour-précis en UTC.
 */
export function countWorkingDays(startISO: string, endISO: string): number {
  if (!startISO) return 0;
  const parse = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  };
  const start = parse(startISO);
  const end = parse(endISO || startISO);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 0;

  // Set des fériés MC couvrant les années de la plage
  const holidays = new Set<string>();
  for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
    for (const h of getMonacoHolidays(y)) holidays.add(h.date);
  }

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getUTCDay(); // 0 = dimanche, 6 = samedi
    const iso = cur.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidays.has(iso)) count++;
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

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
  // Priorité 1 : demi-journée → 0.5
  if (input.isHalfDay === true) {
    return 0.5;
  }

  // Priorité 2 : durée fractionnaire explicite (ex. 0.5 sans isHalfDay)
  if (typeof input.durationDays === 'number' && input.durationDays > 0 && input.durationDays < 1) {
    return input.durationDays;
  }

  // Priorité 3 : calcul à partir des dates en JOURS OUVRÉS (hors WE + fériés MC).
  // On recalcule depuis les dates plutôt que de faire confiance à durationDays
  // stocké : les anciennes demandes ont un comptage calendaire brut à corriger.
  if (input.startDate) {
    return countWorkingDays(input.startDate, input.endDate || input.startDate);
  }

  // Priorité 4 : repli sur durationDays stocké (pas de dates disponibles)
  if (typeof input.durationDays === 'number' && input.durationDays > 0) {
    return input.durationDays;
  }

  // Aucune donnée exploitable
  return 0;
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

