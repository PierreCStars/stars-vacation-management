'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Lang = 'fr' | 'en' | 'it';
type NoticeWindow = {
  id: string;
  enabled: boolean;
  label: string;
  startDate: string;
  endDate: string;
  message: Record<Lang, string>;
};

function newWindow(index: number): NoticeWindow {
  // Pas de Date.now()/Math.random() pour rester déterministe au rendu serveur.
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
 * Éditeur des périodes d'information (popup) — section de la page Administration → Options.
 * Lit/écrit la config via /api/admin/forbidden-notice.
 */
export default function NoticeSettingsSection() {
  const t = useTranslations('adminOptions');
  const [windows, setWindows] = useState<NoticeWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/forbidden-notice')
      .then(r => (r.ok ? r.json() : { windows: [] }))
      .then(d => setWindows(Array.isArray(d?.windows) ? d.windows : []))
      .catch(() => setWindows([]))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<NoticeWindow>) =>
    setWindows(ws => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const updateMsg = (i: number, lang: Lang, val: string) =>
    setWindows(ws => ws.map((w, j) => (j === i ? { ...w, message: { ...w.message, [lang]: val } } : w)));

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
    <section className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900">{t('noticeSection')}</h3>
      <p className="text-sm text-gray-600 mt-1 mb-4">{t('noticeHelp')}</p>

      {loading ? (
        <p className="text-sm text-gray-500">{t('loading')}</p>
      ) : (
        <div className="space-y-4">
          {windows.map((w, i) => (
            <div key={w.id} className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-900">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={w.enabled}
                    onChange={e => update(i, { enabled: e.target.checked })}
                  />
                  {t('enabled')}
                </label>
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => setWindows(ws => ws.filter((_, j) => j !== i))}
                >
                  {t('remove')}
                </button>
              </div>

              <label className="block text-sm text-gray-700">
                {t('label')}
                <input
                  className={inputCls}
                  value={w.label}
                  onChange={e => update(i, { label: e.target.value })}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block text-sm text-gray-700">
                  {t('startDate')}
                  <input
                    type="date"
                    className={inputCls}
                    value={w.startDate}
                    onChange={e => update(i, { startDate: e.target.value })}
                  />
                </label>
                <label className="block text-sm text-gray-700">
                  {t('endDate')}
                  <input
                    type="date"
                    className={inputCls}
                    value={w.endDate}
                    onChange={e => update(i, { endDate: e.target.value })}
                  />
                </label>
              </div>

              {(['fr', 'en', 'it'] as Lang[]).map(lang => (
                <label key={lang} className="block text-sm text-gray-700">
                  {t(lang === 'fr' ? 'messageFr' : lang === 'en' ? 'messageEn' : 'messageIt')}
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={w.message[lang]}
                    onChange={e => updateMsg(i, lang, e.target.value)}
                  />
                </label>
              ))}
            </div>
          ))}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setWindows(ws => [...ws, newWindow(ws.length)])}
          >
            {t('addWindow')}
          </button>

          <div className="flex items-center gap-4 pt-2">
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
    </section>
  );
}
