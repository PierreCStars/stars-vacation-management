// lib/forbiddenDates.ts

export const FORBIDDEN_WINDOWS = [
  { month: 5, startDay: 6, endDay: 10 }, // May 6–10
  { month: 6, startDay: 4, endDay: 7 },  // June 4–7
] as const;

type Lang = 'fr' | 'it' | 'en';

const MODAL_TEXT: Record<Lang, string> = {
  fr: 'Durant la période du Top Marques (06 au 10 mai 206) et du Grand Prix (04 au 07 juin), aucune demande de congés ne sera acceptée',
  en: 'During the Top Marques period (May 6 to 10, 206) and the Grand Prix period (June 4 to 7), no vacation requests will be accepted.',
  it: 'Durante il periodo del Top Marques (dal 6 al 10 maggio 206) e del Gran Premio (dal 4 al 7 giugno), non saranno accettate richieste di ferie.',
};

const DENY_TEXT: Record<Lang, string> = {
  fr: 'Durant la période du Top Marques (06 au 10 mai 206) et du Grand Prix (04 au 07 juin), aucune demande de congés ne sera acceptée. Votre demande a été rejetée automatiquement',
  en: 'During the Top Marques period (May 6 to 10, 206) and the Grand Prix period (June 4 to 7), no vacation requests will be accepted. Your request has been automatically denied',
  it: 'Durante il periodo del Top Marques (dal 6 al 10 maggio 206) e del Gran Premio (dal 4 al 7 giugno), non saranno accettate richieste di ferie. La sua domanda è stata automaticamente rifiutata',
};

/**
 * Resolve locale from user session, browser, or default to 'en'
 * @param userLocale - Optional locale from user profile/session
 * @returns 'fr' | 'it' | 'en'
 */
export function resolveLocale(userLocale?: string): Lang {
  // Try user/session locale first
  if (userLocale) {
    const normalized = userLocale.toLowerCase();
    if (normalized.startsWith('fr')) return 'fr';
    if (normalized.startsWith('it')) return 'it';
  }

  // Fallback to browser navigator
  if (typeof window !== 'undefined') {
    const nav = navigator.language?.toLowerCase() ?? '';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('it')) return 'it';
  }

  return 'en';
}

/**
 * Get the localized sign-in notice message
 * @param locale - 'fr' | 'it' | 'en'
 * @returns Localized message string
 */
export function signInNotice(locale: Lang): string {
  return MODAL_TEXT[locale] ?? MODAL_TEXT.en;
}

/**
 * Get the localized auto-deny message
 * @param locale - 'fr' | 'it' | 'en'
 * @returns Localized denial message string
 */
export function autoDenyMessage(locale: Lang): string {
  return DENY_TEXT[locale] ?? DENY_TEXT.en;
}

/**
 * Add days to a date
 */
function addDays(d: Date, days: number): Date {
  const n = new Date(d);
  n.setDate(n.getDate() + days);
  return n;
}

/**
 * Check if a specific date falls within a forbidden window (ignores year)
 */
function isForbiddenDay(d: Date): boolean {
  const m = d.getMonth() + 1; // JS: 0-based, convert to 1-based
  const day = d.getDate();
  return FORBIDDEN_WINDOWS.some(w => w.month === m && day >= w.startDay && day <= w.endDay);
}

/**
 * Returns true if any day in [start, end] overlaps the annual forbidden windows (ignores year).
 * @param start - Start date (inclusive)
 * @param end - End date (inclusive)
 * @returns true if any day in the range overlaps forbidden windows
 */
export function overlapsForbiddenWindow(start: Date, end: Date): boolean {
  if (end < start) return false;

  let cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  while (cursor <= last) {
    if (isForbiddenDay(cursor)) return true;
    cursor = addDays(cursor, 1);
  }

  return false;
}







