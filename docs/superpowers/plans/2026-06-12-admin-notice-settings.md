# Admin Notice Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux admins de gérer la popup d'information (périodes, dates, messages trilingues, activation) depuis **Administration → Options**, persistée dans Firestore, sans déploiement.

**Architecture:** Logique pure isolée et testable (`src/lib/forbiddenNotice.ts`) ; deux routes API (lecture publique des périodes actives / lecture-écriture admin) sur Firestore via `getFirebaseAdmin()` ; page admin client `/[locale]/admin/options` ; la popup (`ForbiddenDatesNotice` + `NoticeModal`) lit l'API. Le rejet automatique (`FORBIDDEN_WINDOWS`) reste inchangé.

**Tech Stack:** Next.js App Router, TypeScript, Firestore (firebase-admin), next-auth, next-intl, vitest.

---

## File Structure

- **Create** `src/lib/forbiddenNotice.ts` — types + logique pure (active windows, validation, seed par défaut). Aucune dépendance Firestore → testable.
- **Create** `src/lib/__tests__/forbiddenNotice.test.ts` — tests unitaires de la logique pure.
- **Create** `src/app/api/forbidden-notice/route.ts` — `GET` (tout user connecté) périodes actives.
- **Create** `src/app/api/admin/forbidden-notice/route.ts` — `GET`/`PUT` admin.
- **Create** `src/app/[locale]/admin/options/page.tsx` — page server.
- **Create** `src/app/[locale]/admin/options/AdminOptionsClient.tsx` — UI client.
- **Modify** `src/components/NoticeModal.tsx` — accepter une liste de messages.
- **Modify** `src/components/ForbiddenDatesNotice.tsx` — lire l'API au lieu du flag.
- **Modify** `src/lib/forbiddenDates.ts` — retirer `SHOW_FORBIDDEN_NOTICE` (garder le reste).
- **Modify** `src/components/nav/AdminDropdown.tsx` — item « Options ».
- **Modify** `src/locales/{fr,en,it}.json` — clés `nav.options` + namespace `adminOptions`.

Constante partagée du chemin du doc Firestore : collection `settings`, doc `forbiddenNotice`.

---

### Task 1: Logique pure + types (`forbiddenNotice.ts`)

**Files:**
- Create: `src/lib/forbiddenNotice.ts`
- Test: `src/lib/__tests__/forbiddenNotice.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/forbiddenNotice.test.ts
import { describe, it, expect } from 'vitest';
import {
  getActiveWindows,
  validateWindows,
  type NoticeWindow,
} from '../forbiddenNotice';

const win = (over: Partial<NoticeWindow> = {}): NoticeWindow => ({
  id: '1', enabled: true, label: 'Top Marques',
  startDate: '2027-05-06', endDate: '2027-05-10',
  message: { fr: 'fr', en: 'en', it: 'it' }, ...over,
});

describe('getActiveWindows', () => {
  it('inclut une fenêtre activée si le jour est dans la plage (bornes incluses)', () => {
    expect(getActiveWindows([win()], '2027-05-06')).toHaveLength(1);
    expect(getActiveWindows([win()], '2027-05-10')).toHaveLength(1);
  });
  it('exclut hors plage', () => {
    expect(getActiveWindows([win()], '2027-05-05')).toHaveLength(0);
    expect(getActiveWindows([win()], '2027-05-11')).toHaveLength(0);
  });
  it('exclut une fenêtre désactivée', () => {
    expect(getActiveWindows([win({ enabled: false })], '2027-05-06')).toHaveLength(0);
  });
  it('gère plusieurs fenêtres actives', () => {
    const a = win({ id: 'a' });
    const b = win({ id: 'b', startDate: '2027-05-01', endDate: '2027-12-31' });
    expect(getActiveWindows([a, b], '2027-05-06')).toHaveLength(2);
  });
});

describe('validateWindows', () => {
  it('accepte des fenêtres valides', () => {
    expect(validateWindows([win()]).ok).toBe(true);
  });
  it('rejette startDate > endDate', () => {
    expect(validateWindows([win({ startDate: '2027-05-11' })]).ok).toBe(false);
  });
  it('rejette une date mal formée', () => {
    expect(validateWindows([win({ startDate: '06/05/2027' })]).ok).toBe(false);
  });
  it('rejette un libellé vide', () => {
    expect(validateWindows([win({ label: '' })]).ok).toBe(false);
  });
  it('rejette un message EN vide', () => {
    expect(validateWindows([win({ message: { fr: 'x', en: '', it: 'y' } })]).ok).toBe(false);
  });
  it('rejette plus de 20 fenêtres', () => {
    expect(validateWindows(Array.from({ length: 21 }, (_, i) => win({ id: String(i) }))).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/forbiddenNotice.test.ts`
Expected: FAIL — `Cannot find module '../forbiddenNotice'`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/forbiddenNotice.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/forbiddenNotice.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/forbiddenNotice.ts src/lib/__tests__/forbiddenNotice.test.ts
git commit -m "feat(notice): logique pure + validation des périodes (TDD)"
```

---

### Task 2: Route API lecture publique (`/api/forbidden-notice`)

**Files:**
- Create: `src/app/api/forbidden-notice/route.ts`

- [ ] **Step 1: Implement the GET route**

```ts
// src/app/api/forbidden-notice/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  getActiveWindows, todayUtcYMD, NOTICE_DOC,
  type ForbiddenNoticeSettings,
} from '@/lib/forbiddenNotice';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ active: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const { db, error } = getFirebaseAdmin();
  if (!db || error) {
    return NextResponse.json({ active: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const snap = await db.collection(NOTICE_DOC.collection).doc(NOTICE_DOC.doc).get();
    const data = (snap.exists ? snap.data() : null) as ForbiddenNoticeSettings | null;
    const active = getActiveWindows(data?.windows ?? [], todayUtcYMD())
      .map(w => ({ id: w.id, message: w.message }));
    return NextResponse.json({ active }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ active: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 erreur sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/forbidden-notice/route.ts
git commit -m "feat(notice): API lecture publique des périodes actives"
```

---

### Task 3: Route API admin (`/api/admin/forbidden-notice`)

**Files:**
- Create: `src/app/api/admin/forbidden-notice/route.ts`

- [ ] **Step 1: Implement GET + PUT (admin only)**

```ts
// src/app/api/admin/forbidden-notice/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isFullAdmin } from '@/config/admins';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import {
  validateWindows, defaultNoticeSettings, NOTICE_DOC,
  type ForbiddenNoticeSettings,
} from '@/lib/forbiddenNotice';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || !isFullAdmin(email)) return null;
  return email;
}

export async function GET() {
  const email = await requireAdmin();
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { db, error } = getFirebaseAdmin();
  if (!db || error) return NextResponse.json({ error: error || 'Firebase disabled' }, { status: 503 });
  const snap = await db.collection(NOTICE_DOC.collection).doc(NOTICE_DOC.doc).get();
  const data = snap.exists ? (snap.data() as ForbiddenNoticeSettings) : defaultNoticeSettings();
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest) {
  const email = await requireAdmin();
  if (!email) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  let body: { windows?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const check = validateWindows(body?.windows);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });
  const { db, error } = getFirebaseAdmin();
  if (!db || error) return NextResponse.json({ error: error || 'Firebase disabled' }, { status: 503 });
  const payload: ForbiddenNoticeSettings = {
    windows: body.windows as ForbiddenNoticeSettings['windows'],
    updatedAt: new Date().toISOString(),
    updatedBy: email,
  };
  await db.collection(NOTICE_DOC.collection).doc(NOTICE_DOC.doc).set(payload);
  return NextResponse.json({ ok: true, ...payload });
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 erreur sur ce fichier.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/forbidden-notice/route.ts
git commit -m "feat(notice): API admin GET/PUT config (validation serveur)"
```

---

### Task 4: NoticeModal — liste de messages

**Files:**
- Modify: `src/components/NoticeModal.tsx`

- [ ] **Step 1: Replace the component**

```tsx
// src/components/NoticeModal.tsx
'use client';
import { useEffect, useState } from 'react';

type Props = { open?: boolean; onClose?: () => void; messages?: string[] };

export default function NoticeModal({ open, onClose, messages = [] }: Props) {
  const [isOpen, setIsOpen] = useState(!!open);
  useEffect(() => setIsOpen(!!open), [open]);
  if (!isOpen || messages.length === 0) return null;

  return (
    <div className="slg-modal-backdrop">
      <div className="slg-modal max-w-lg">
        <h2 className="mb-3 text-xl font-semibold">Information</h2>
        <div className="mb-6 space-y-3">
          {messages.map((m, i) => (
            <p key={i} className="leading-relaxed text-slate-ardoise">{m}</p>
          ))}
        </div>
        <div className="flex justify-end">
          <button className="btn-secondary" onClick={() => { setIsOpen(false); onClose?.(); }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: erreurs UNIQUEMENT chez les appelants de NoticeModal (corrigées Task 5). Aucune erreur interne au fichier.

- [ ] **Step 3: Commit**

```bash
git add src/components/NoticeModal.tsx
git commit -m "feat(notice): NoticeModal accepte une liste de messages"
```

---

### Task 5: ForbiddenDatesNotice — lecture via API

**Files:**
- Modify: `src/components/ForbiddenDatesNotice.tsx`

- [ ] **Step 1: Replace the component**

```tsx
// src/components/ForbiddenDatesNotice.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NoticeModal from './NoticeModal';

type Lang = 'fr' | 'en' | 'it';
type ActiveNotice = { id: string; message: Record<Lang, string> };

/** Affiche, une fois par session, les messages des périodes actives (réglées en admin). */
export default function ForbiddenDatesNotice() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [messages, setMessages] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  const seg = pathname?.split('/')[1];
  const locale: Lang = seg === 'fr' || seg === 'it' ? seg : 'en';

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('forbidden-notice-shown')) return;

    let cancelled = false;
    fetch('/api/forbidden-notice')
      .then(r => r.ok ? r.json() : { active: [] })
      .then((data: { active: ActiveNotice[] }) => {
        if (cancelled) return;
        const msgs = (data.active ?? [])
          .map(a => a.message?.[locale] || a.message?.en)
          .filter((m): m is string => !!m);
        if (msgs.length > 0) {
          setMessages(msgs);
          setShow(true);
          sessionStorage.setItem('forbidden-notice-shown', '1');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session, status, locale]);

  return <NoticeModal open={show} messages={messages} onClose={() => setShow(false)} />;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/ForbiddenDatesNotice.tsx
git commit -m "feat(notice): popup pilotée par l'API au lieu du flag"
```

---

### Task 6: Nettoyer `forbiddenDates.ts`

**Files:**
- Modify: `src/lib/forbiddenDates.ts`

- [ ] **Step 1: Supprimer le flag `SHOW_FORBIDDEN_NOTICE`**

Retirer le bloc commentaire + la ligne `export const SHOW_FORBIDDEN_NOTICE = false;` ajoutés précédemment. **Conserver** `FORBIDDEN_WINDOWS`, `overlapsForbiddenWindow`, `autoDenyMessage`, `resolveLocale`, `signInNotice` (signInNotice peut rester ou être retiré s'il n'est plus référencé — vérifier avec grep).

- [ ] **Step 2: Vérifier qu'aucun import résiduel ne casse**

Run: `grep -rn "SHOW_FORBIDDEN_NOTICE" src` → doit ne rien retourner.
Run: `npx tsc --noEmit` → 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/forbiddenDates.ts
git commit -m "refactor(notice): retire le flag SHOW_FORBIDDEN_NOTICE (remplacé par Firestore)"
```

---

### Task 7: i18n — clés de traduction

**Files:**
- Modify: `src/locales/fr.json`, `src/locales/en.json`, `src/locales/it.json`

- [ ] **Step 1: Ajouter `nav.options` et le namespace `adminOptions`**

Dans chaque fichier, ajouter à l'objet `nav` la clé `options`, et au niveau racine un objet `adminOptions`.

`fr.json` :
```json
"nav": { "...": "...", "options": "Options" },
"adminOptions": {
  "title": "Options",
  "noticeSection": "Périodes d'information (popup)",
  "addWindow": "Ajouter une période",
  "remove": "Supprimer",
  "enabled": "Activée",
  "label": "Libellé",
  "startDate": "Date de début",
  "endDate": "Date de fin",
  "messageFr": "Message (FR)",
  "messageEn": "Message (EN)",
  "messageIt": "Message (IT)",
  "save": "Enregistrer",
  "saved": "Enregistré",
  "saveError": "Erreur lors de l'enregistrement"
}
```

`en.json` (valeurs EN) : `"options": "Options"`, title "Options", noticeSection "Information periods (popup)", addWindow "Add a period", remove "Remove", enabled "Enabled", label "Label", startDate "Start date", endDate "End date", messageFr/En/It "Message (FR/EN/IT)", save "Save", saved "Saved", saveError "Error while saving".

`it.json` (valeurs IT) : `"options": "Opzioni"`, title "Opzioni", noticeSection "Periodi informativi (popup)", addWindow "Aggiungi un periodo", remove "Rimuovi", enabled "Attiva", label "Etichetta", startDate "Data di inizio", endDate "Data di fine", messageFr/En/It "Messaggio (FR/EN/IT)", save "Salva", saved "Salvato", saveError "Errore durante il salvataggio".

- [ ] **Step 2: Vérifier le JSON valide**

Run: `node -e "['fr','en','it'].forEach(l=>{const j=require('./src/locales/'+l+'.json');if(!j.nav.options||!j.adminOptions)throw new Error(l);});console.log('ok')"`
Expected: `ok`.

- [ ] **Step 3: Commit**

```bash
git add src/locales/fr.json src/locales/en.json src/locales/it.json
git commit -m "i18n(notice): clés nav.options + adminOptions (fr/en/it)"
```

---

### Task 8: Page admin `Administration → Options`

**Files:**
- Create: `src/app/[locale]/admin/options/page.tsx`
- Create: `src/app/[locale]/admin/options/AdminOptionsClient.tsx`

- [ ] **Step 1: Page server**

```tsx
// src/app/[locale]/admin/options/page.tsx
import { unstable_noStore } from 'next/cache';
import AdminOptionsClient from './AdminOptionsClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminOptionsPage() {
  unstable_noStore();
  return <AdminOptionsClient />;
}
```

- [ ] **Step 2: Composant client (éditeur de périodes)**

```tsx
// src/app/[locale]/admin/options/AdminOptionsClient.tsx
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

type Lang = 'fr' | 'en' | 'it';
type NoticeWindow = {
  id: string; enabled: boolean; label: string;
  startDate: string; endDate: string; message: Record<Lang, string>;
};

function newWindow(): NoticeWindow {
  return { id: `w-${Date.now()}-${Math.floor(Math.random() * 1e6)}`, enabled: false,
    label: '', startDate: '', endDate: '', message: { fr: '', en: '', it: '' } };
}

export default function AdminOptionsClient() {
  const t = useTranslations('adminOptions');
  const [windows, setWindows] = useState<NoticeWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/forbidden-notice')
      .then(r => r.json())
      .then(d => setWindows(Array.isArray(d?.windows) ? d.windows : []))
      .catch(() => setWindows([]))
      .finally(() => setLoading(false));
  }, []);

  const update = (i: number, patch: Partial<NoticeWindow>) =>
    setWindows(ws => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)));
  const updateMsg = (i: number, lang: Lang, val: string) =>
    setWindows(ws => ws.map((w, j) => (j === i ? { ...w, message: { ...w.message, [lang]: val } } : w)));

  async function save() {
    setSaving(true); setToast(null);
    try {
      const res = await fetch('/api/admin/forbidden-notice', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ windows }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'error');
      setToast({ ok: true, msg: t('saved') });
    } catch (e) {
      setToast({ ok: false, msg: `${t('saveError')}: ${(e as Error).message}` });
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-6">…</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-light tracking-tight">{t('title')}</h1>
      <section className="space-y-4">
        <h2 className="text-xs uppercase tracking-widest text-slate-ardoise">{t('noticeSection')}</h2>
        {windows.map((w, i) => (
          <div key={w.id} className="bg-white shadow-card border border-black/5 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={w.enabled}
                  onChange={e => update(i, { enabled: e.target.checked })} />
                {t('enabled')}
              </label>
              <button className="btn-secondary text-sm"
                onClick={() => setWindows(ws => ws.filter((_, j) => j !== i))}>
                {t('remove')}
              </button>
            </div>
            <label className="block text-sm">{t('label')}
              <input className="mt-1 w-full border rounded px-2 py-1" value={w.label}
                onChange={e => update(i, { label: e.target.value })} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">{t('startDate')}
                <input type="date" className="mt-1 w-full border rounded px-2 py-1" value={w.startDate}
                  onChange={e => update(i, { startDate: e.target.value })} />
              </label>
              <label className="block text-sm">{t('endDate')}
                <input type="date" className="mt-1 w-full border rounded px-2 py-1" value={w.endDate}
                  onChange={e => update(i, { endDate: e.target.value })} />
              </label>
            </div>
            {(['fr', 'en', 'it'] as Lang[]).map(lang => (
              <label key={lang} className="block text-sm">
                {t(lang === 'fr' ? 'messageFr' : lang === 'en' ? 'messageEn' : 'messageIt')}
                <textarea className="mt-1 w-full border rounded px-2 py-1" rows={2}
                  value={w.message[lang]} onChange={e => updateMsg(i, lang, e.target.value)} />
              </label>
            ))}
          </div>
        ))}
        <button className="btn-secondary" onClick={() => setWindows(ws => [...ws, newWindow()])}>
          {t('addWindow')}
        </button>
      </section>
      <div className="flex items-center gap-4">
        <button className="btn-primary" disabled={saving} onClick={save}>
          {saving ? '…' : t('save')}
        </button>
        {toast && <span className={toast.ok ? 'text-[#5C7C5A]' : 'text-[#A23B2D]'}>{toast.msg}</span>}
      </div>
    </div>
  );
}
```

> Note UI : `btn-primary`/`btn-secondary`/`shadcn`-like classes existent déjà (cf. NoticeModal/admin). Si `btn-primary` n'existe pas, réutiliser la classe de bouton primaire présente dans le projet (vérifier `src/app/globals.css`).

- [ ] **Step 3: Verify typecheck + build**

Run: `npx tsc --noEmit` → 0 erreur.
Run: `npm run build` → succès.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/admin/options/page.tsx src/app/[locale]/admin/options/AdminOptionsClient.tsx
git commit -m "feat(notice): page Administration → Options (éditeur de périodes)"
```

---

### Task 9: Navigation — item « Options »

**Files:**
- Modify: `src/components/nav/AdminDropdown.tsx`

- [ ] **Step 1: Ajouter le lien dans la section Management**

Après le lien `setup`, dupliquer le pattern `<Link>` pour `/admin/options` (clé `tNav('options')`, réutiliser l'icône engrenage ou une icône simple). Mettre à jour `hasActiveChild` :

```ts
const hasActiveChild =
  isActive('/admin/vacation-requests') || isActive('/admin/analytics') ||
  isActive('/admin/setup') || isActive('/admin/options');
```

Lien à insérer (même structure que `setup`) :
```tsx
<Link
  href={createLocaleUrl('/admin/options', currentLocale)}
  onClick={() => setIsOpen(false)}
  className={`block px-4 py-2 rounded-md text-sm transition-colors ${
    isActive('/admin/options')
      ? 'bg-gold/10 text-ink font-medium'
      : 'text-slate-ardoise hover:bg-cream hover:text-ink'
  }`}
>
  <div className="flex items-center gap-2">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    {tNav('options')}
  </div>
</Link>
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc --noEmit` → 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add src/components/nav/AdminDropdown.tsx
git commit -m "feat(nav): item Administration → Options"
```

---

### Task 10: Vérification UI (gates obligatoires) + déploiement

- [ ] **Step 1: Garde-fous UX/design (guidelines Stars)**

Invoquer `ui-ux-pro-max` (responsive du formulaire : mobile-first, cibles touch ≥ 44px, labels visibles, focus, contraste) puis `/impeccable polish` sur `AdminOptionsClient.tsx` (anti-slop, hiérarchie, typographie Montserrat, palette Stars). Corriger les findings.

- [ ] **Step 2: Vérification fonctionnelle locale**

Run: `npm run build:check` → succès.
Manuel (si env dispo) : se connecter en admin → Administration → Options → ajouter une période activée couvrant aujourd'hui → recharger une page → la popup s'affiche dans la langue courante ; désactiver → ne s'affiche plus.

- [ ] **Step 3: Push + preview Vercel**

```bash
git push -u origin feat/admin-notice-settings
vercel deploy --yes
```
Valider le preview (popup + page Options) avant prod.

- [ ] **Step 4: Prod (après validation Pierre)**

```bash
vercel deploy --prod --yes
```

- [ ] **Step 5: Merge `feat/admin-notice-settings` → `main`** (après accord) et nettoyer la branche.

---

## Self-Review (effectué)

- **Couverture spec** : modèle Firestore (Task 1), affichage actif (Task 1+2+5), API publique (Task 2), API admin + validation (Task 3), UI Options (Task 8), nav (Task 9), popup multi-messages (Task 4+5), seed par défaut (Task 1, servi par Task 3), retrait flag (Task 6), i18n (Task 7), hors-périmètre rejet auto (non touché). ✓
- **Placeholders** : aucun — code complet à chaque step.
- **Cohérence des types** : `NoticeWindow`/`message: Record<Lang,string>` identiques entre `forbiddenNotice.ts`, les routes, le client et NoticeModal (`messages: string[]`). `NOTICE_DOC` partagé. ✓
- **Point de vigilance** : vérifier l'existence des classes `btn-primary`/`btn-secondary`/`slg-modal*` dans `globals.css` (Task 8 note) — sinon réutiliser les classes équivalentes du projet.
