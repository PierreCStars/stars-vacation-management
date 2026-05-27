// lib/forbiddenDates.ts

/**
 * Year-specific forbidden windows (inclusive ISO dates).
 * Datés volontairement : ces événements ont une date précise chaque année,
 * donc on ne bloque QUE l'occurrence 2026 — pas tous les 6-10 mai à perpétuité.
 * Mettre à jour ces dates chaque année (ou les déplacer en config/env).
 */
export const FORBIDDEN_WINDOWS = [
  { label: 'Top Marques', start: '2026-05-06', end: '2026-05-10' },
  { label: 'Grand Prix',  start: '2026-06-04', end: '2026-06-07' },
] as const;

type Lang = 'fr' | 'it' | 'en';

const MODAL_TEXT: Record<Lang, string> = {
  fr: 'Durant la période du Top Marques (06 au 10 mai 2026) et du Grand Prix (04 au 07 juin 2026), aucune demande de congés ne sera acceptée',
  en: 'During the Top Marques period (May 6 to 10, 2026) and the Grand Prix period (June 4 to 7, 2026), no vacation requests will be accepted.',
  it: 'Durante il periodo del Top Marques (dal 6 al 10 maggio 2026) e del Gran Premio (dal 4 al 7 giugno 2026), non saranno accettate richieste di ferie.',
};

const DENY_TEXT: Record<Lang, string> = {
  fr: 'Durant la période du Top Marques (06 au 10 mai 2026) et du Grand Prix (04 au 07 juin 2026), aucune demande de congés ne sera acceptée. Votre demande a été rejetée automatiquement',
  en: 'During the Top Marques period (May 6 to 10, 2026) and the Grand Prix period (June 4 to 7, 2026), no vacation requests will be accepted. Your request has been automatically denied',
  it: 'Durante il periodo del Top Marques (dal 6 al 10 maggio 2026) e del Gran Premio (dal 4 al 7 giugno 2026), non saranno accettate richieste di ferie. La sua domanda è stata automaticamente rifiutata',
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

/** Parse an ISO 'YYYY-MM-DD' to a UTC-midnight Date (year-specific, no TZ drift). */
function parseDay(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Normalize any Date to UTC midnight so comparisons are day-precise. */
function toUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Returns true if the request range [start, end] overlaps any year-specific
 * forbidden window. Standard inclusive interval overlap:
 *   rangeStart <= windowEnd AND windowStart <= rangeEnd
 *
 * @param start - Start date (inclusive)
 * @param end - End date (inclusive)
 */
export function overlapsForbiddenWindow(start: Date, end: Date): boolean {
  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  const s = toUtcDay(start);
  const e = toUtcDay(end);
  if (e < s) return false;

  return FORBIDDEN_WINDOWS.some(w => {
    const ws = parseDay(w.start);
    const we = parseDay(w.end);
    return s <= we && ws <= e;
  });
}









