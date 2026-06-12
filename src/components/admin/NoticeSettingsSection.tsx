'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Lang = 'fr' | 'en' | 'it';
const LANGS: Lang[] = ['fr', 'en', 'it'];
const MSG_KEY: Record<Lang, 'messageFr' | 'messageEn' | 'messageIt'> = {
  fr: 'messageFr',
  en: 'messageEn',
  it: 'messageIt',
};

type NoticeWindow = {
  id: string;
  enabled: boolean;
  label: string;
  startDate: string;
  endDate: string;
  message: Record<Lang, string>;
};

function newWindow(index: number): NoticeWindow {
  return {
    id: `w-${index}-${Date.now()}`,
    enabled: false,
    label: '',
    startDate: '',
    endDate: '',
    message: { fr: '', en: '', it: '' },
  };
}

/**
 * Éditeur des périodes d'information (popup) — section de Administration → Options.
 * Lit/écrit via /api/admin/forbidden-notice ; bouton « Traduire » via /api/admin/translate.
 */
export default function NoticeSettingsSection() {
  const t = useTranslations('adminOptions');
  const [windows, setWindows] = useState<NoticeWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState<Record<string, boolean>>({}); // clé `${i}-${lang}`

  useEffect(() => {
    fetch('/api/admin/forbidden-notice')
      .then((r) => (r.ok ? r.json() : { windows: [] }))
      .then((d) => setWindows(Array.isArray(d?.windows) ? d.windows : []))
      .catch(() => setWindows([]))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<NoticeWindow>) =>
    setWindows((ws) => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const updateMsg = (i: number, lang: Lang, val: string) =>
    setWindows((ws) =>
      ws.map((w, j) => (j === i ? { ...w, message: { ...w.message, [lang]: val } } : w)),
    );

  async function translate(i: number, source: Lang) {
    const text = windows[i]?.message[source]?.trim();
    if (!text) return;
    const targets = LANGS.filter((l) => l !== source);
    setBusy((b) => ({ ...b, [`${i}-${source}`]: true }));
    setToast(null);
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source, targets }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'error');
      const { translations } = (await res.json()) as { translations: Partial<Record<Lang, string>> };
      setWindows((ws) =>
        ws.map((w, j) =>
          j === i ? { ...w, message: { ...w.message, ...translations } } : w,
        ),
      );
    } catch (e) {
      setToast({ ok: false, msg: `${t('translateError')}: ${(e as Error).message}` });
    } finally {
      setBusy((b) => ({ ...b, [`${i}-${source}`]: false }));
    }
  }

  async function save() {
    setSaving(true);
    setToast(null);
    try {
      const res = await fetch('/api/admin/forbidden-notice', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windows }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'error');
      setToast({ ok: true, msg: t('saved') });
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setToast({ ok: false, msg: `${t('saveError')}: ${(e as Error).message}` });
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold';

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">{t('noticeHelp')}</p>

      {loading ? (
        <p className="text-sm text-gray-500">{t('loading')}</p>
      ) : (
        <div className="space-y-4">
          {windows.map((w, i) => (
            <div key={w.id} className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={w.enabled}
                    onChange={(e) => update(i, { enabled: e.target.checked })}
                  />
                  {t('enabled')}
                </label>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setWindows((ws) => ws.filter((_, j) => j !== i))}
                >
                  {t('remove')}
                </button>
              </div>

              <label className="block text-sm text-gray-700">
                {t('label')}
                <input
                  className={inputCls}
                  value={w.label}
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm text-gray-700">
                  {t('startDate')}
                  <input
                    type="date"
                    className={inputCls}
                    value={w.startDate}
                    onChange={(e) => update(i, { startDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  {t('endDate')}
                  <input
                    type="date"
                    className={inputCls}
                    value={w.endDate}
                    onChange={(e) => update(i, { endDate: e.target.value })}
                  />
                </label>
              </div>

              <div className="space-y-3">
                {LANGS.map((lang) => {
                  const isBusy = !!busy[`${i}-${lang}`];
                  return (
                    <div key={lang}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{t(MSG_KEY[lang])}</span>
                        <button
                          type="button"
                          className="text-xs font-medium text-gold hover:underline disabled:opacity-50"
                          disabled={isBusy || !w.message[lang]?.trim()}
                          onClick={() => translate(i, lang)}
                          title={t('translate')}
                        >
                          {isBusy ? t('translating') : `↳ ${t('translate')}`}
                        </button>
                      </div>
                      <textarea
                        className={inputCls}
                        rows={2}
                        value={w.message[lang]}
                        onChange={(e) => updateMsg(i, lang, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setWindows((ws) => [...ws, newWindow(ws.length)])}
            >
              {t('addWindow')}
            </button>
            <button type="button" className="btn-primary" disabled={saving} onClick={save}>
              {saving ? t('saving') : t('save')}
            </button>
            {toast && (
              <span className={`text-sm ${toast.ok ? 'text-[#5C7C5A]' : 'text-[#A23B2D]'}`}>
                {toast.msg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
