export type Lang = 'fr' | 'en' | 'it';

export type NoticeWindow = {
  id: string;
  enabled: boolean;
  label: string;
  startDate: string; // 'YYYY-MM-DD' inclusive
  endDate: string;   // 'YYYY-MM-DD' inclusive
  message: Record<Lang, string>;
};

export type ForbiddenNoticeSettings = {
  windows: NoticeWindow[];
  updatedAt: string;
  updatedBy: string;
};

export const NOTICE_DOC = { collection: 'settings', doc: 'forbiddenNotice' } as const;
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_WINDOWS = 20;

/** Périodes activées dont [startDate,endDate] (inclus) contient `todayYMD`. */
export function getActiveWindows(windows: NoticeWindow[], todayYMD: string): NoticeWindow[] {
  if (!Array.isArray(windows)) return [];
  return windows.filter(
    w => w?.enabled && ISO_DAY.test(w.startDate) && ISO_DAY.test(w.endDate)
      && w.startDate <= todayYMD && todayYMD <= w.endDate,
  );
}

export type ValidationResult = { ok: boolean; error?: string };

export function validateWindows(windows: unknown): ValidationResult {
  if (!Array.isArray(windows)) return { ok: false, error: 'windows must be an array' };
  if (windows.length > MAX_WINDOWS) return { ok: false, error: `max ${MAX_WINDOWS} windows` };
  for (const w of windows as NoticeWindow[]) {
    if (!w || typeof w !== 'object') return { ok: false, error: 'invalid window' };
    if (typeof w.enabled !== 'boolean') return { ok: false, error: 'enabled must be boolean' };
    if (!w.label || !w.label.trim()) return { ok: false, error: 'label required' };
    if (!ISO_DAY.test(w.startDate) || !ISO_DAY.test(w.endDate)) return { ok: false, error: 'dates must be YYYY-MM-DD' };
    if (w.startDate > w.endDate) return { ok: false, error: 'startDate must be <= endDate' };
    if (!w.message || !w.message.en || !w.message.en.trim()) return { ok: false, error: 'english message required' };
  }
  return { ok: true };
}

/** YYYY-MM-DD du jour en UTC (jour-précis, pas de dérive TZ). */
export function todayUtcYMD(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Gabarit par défaut (périodes existantes désactivées, prêtes pour 2027). */
export function defaultNoticeSettings(): ForbiddenNoticeSettings {
  return {
    windows: [
      { id: 'top-marques', enabled: false, label: 'Top Marques',
        startDate: '2026-05-06', endDate: '2026-05-10',
        message: {
          fr: "Durant la période du Top Marques, aucune demande de congés ne sera acceptée.",
          en: "During the Top Marques period, no vacation requests will be accepted.",
          it: "Durante il periodo del Top Marques, non saranno accettate richieste di ferie." } },
      { id: 'grand-prix', enabled: false, label: 'Grand Prix',
        startDate: '2026-06-04', endDate: '2026-06-07',
        message: {
          fr: "Durant la période du Grand Prix, aucune demande de congés ne sera acceptée.",
          en: "During the Grand Prix period, no vacation requests will be accepted.",
          it: "Durante il periodo del Gran Premio, non saranno accettate richieste di ferie." } },
    ],
    updatedAt: '', updatedBy: '',
  };
}
