# Stars Vacation Management — Documentation de l'application

> Document de référence interne. Dernière mise à jour : 2026-06-12.
> Projet Vercel : **`stars_vacation_management_v2`** · Repo : `PierreCStars/stars-vacation-management`.

---

## 1. Vue d'ensemble

Application interne de **gestion des demandes de congés** pour Star Luxury Group,
avec workflow de validation, intégration Google Calendar, notifications email
automatiques, tableau de bord analytique et interface trilingue (FR / EN / IT).

Utilisateurs :
- **Employés** : soumettent des demandes de congés, suivent leur statut.
- **Administrateurs** : valident/refusent, consultent l'analytique, configurent l'app.

---

## 2. Stack technique

| Couche | Techno |
|---|---|
| Framework | **Next.js (App Router)**, TypeScript strict, React |
| Styles | Tailwind CSS (+ `tailwindcss-animate`), charte Stars |
| i18n | **next-intl**, routing localisé `/[locale]/…`, locales `en` (défaut), `fr`, `it` |
| Auth | **next-auth** — Google OAuth (prod) + Credentials (preview/dev) |
| Base de données | **Firebase Firestore** (via `firebase-admin` côté serveur, `firebase` côté client) |
| Intégrations Google | **googleapis** (Google Calendar), Gmail/SMTP via `nodemailer` |
| Validation | **zod** |
| Formulaires | react-hook-form (+ `@hookform/resolvers`) |
| Charts | **recharts** (analytique) |
| Drag & drop | `@dnd-kit/*` |
| Tests | **vitest** (unit), **Playwright** (e2e), msw |
| Hébergement | **Vercel** (Fluid Compute, crons Vercel) |

> Note : `prisma`/`@prisma/client` figurent dans les dépendances et des scripts
> `db:*` existent, mais **aucun `schema.prisma` n'est présent** dans le repo —
> la base de données effective est **Firestore**. Les artefacts Prisma semblent
> vestigiaux (à nettoyer ultérieurement, hors périmètre).

---

## 3. Structure du projet

```
src/
├── app/
│   ├── [locale]/              # pages localisées (App Router)
│   │   ├── admin/             # espace admin
│   │   │   ├── vacation-requests/   # validation des demandes
│   │   │   ├── analytics/           # tableau de bord analytique
│   │   │   ├── setup/               # configuration / diagnostics
│   │   │   └── calendar-sync/       # synchro calendrier
│   │   └── layout.tsx         # layout localisé (monte ForbiddenDatesNotice)
│   ├── api/                   # routes API (voir §7)
│   ├── auth/ login/           # pages d'authentification
│   └── diagnostics/ test*/    # pages de debug
├── components/
│   ├── admin/                 # composants admin (modales, listes)
│   ├── nav/                   # navigation (AdminDropdown…)
│   ├── ui/                    # primitives UI
│   ├── NoticeModal.tsx        # modale d'information (popup)
│   └── ForbiddenDatesNotice.tsx
├── config/admins.ts          # allowlist admin + rôles
├── contexts/                 # contexts React (langue…)
├── i18n/routing.ts           # locales + helpers d'URL localisées
├── lib/                      # logique métier (firebase, google, email, cron, analytics…)
├── locales/{fr,en,it}.json   # traductions
└── types/                    # types (VacationRequest, statuts…)
```

Le repo contient aussi de **nombreux fichiers `*.md` de notes de fix historiques**
à la racine (ex. `GOOGLE_CALENDAR_SYNC_FIX_*.md`) : ce sont des journaux de
débogage ponctuels, pas la documentation de référence. **Ce fichier
(`DOCUMENTATION.md`) fait foi.**

---

## 4. Authentification & rôles

- **Providers** (`src/lib/auth.ts`) :
  - **Google OAuth** en production.
  - **Credentials** en preview/développement (validé en amont).
- **Restriction de domaine** : connexion limitée au domaine autorisé
  (`NEXTAUTH_ALLOW_DOMAIN`, ex. `stars.mc`) + allowlist d'emails
  (`NEXTAUTH_ALLOW_EMAILS`).
- **Rôles admin** (`src/config/admins.ts`) — allowlist en dur :
  - `ALL` (admin complet) : `pierre@`, `johnny@`, `daniel@` `@stars.mc`.
  - `READ_ONLY` : `compta@stars.mc`.
  - Helpers : `isAdmin()`, `isFullAdmin()`, `isReadOnlyAdmin()`.
- Pattern de garde côté API/pages : `getServerSession(authOptions)` + `isAdmin/isFullAdmin`.

---

## 5. Internationalisation (i18n)

- **next-intl**, routing `/[locale]/…`, locales : `en` (défaut), `fr`, `it`.
- `middleware.ts` redirige tout chemin non localisé vers `/en` (hors `api/health`, assets).
- Traductions dans `src/locales/{fr,en,it}.json`. **Toute string visible doit exister
  dans les 3 fichiers** (règle projet).
- Switcher de langue dans la navigation.

---

## 6. Modèle de données

Collection Firestore principale : demandes de congés. Type de référence
(`src/types/vacations.ts`) :

```ts
interface VacationRequest {
  id: string;
  userId: string; userEmail: string; userName: string;
  startDate: string; endDate: string;          // 'YYYY-MM-DD'
  reason?: string; company?: string; type: string;
  status: VacationStatus;                       // pending | approved | denied | cancelled
  createdAt: string;
  reviewedBy?: string; reviewerEmail?: string; reviewedAt?: string | null;
  adminComment?: string;
  denialReason?: string;                        // ex. rejet auto (dates interdites)
  included?: boolean; openDays?: string;
  isHalfDay?: boolean; halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;                        // 0.5, 1, 2.5…
  // + champs d'intégration Google Calendar
}
```

Autres données : périodes interdites (voir §9), et — à venir — réglages de la
popup d'information (doc Firestore `settings/forbiddenNotice`).

---

## 7. Routes API (`src/app/api/`)

**Demandes de congés**
- `vacation-requests/` (+ `[id]/`) : CRUD + transitions de statut.
- `admin/vacations/` : opérations admin sur les demandes.
- `admin/export-reviewed-requests/`, `clear-reviewed-requests/`.

**Synchronisation**
- `sync/approved-requests/`, `sync/request/[id]/`, `sync/import-remote/` : synchro
  des demandes validées vers Google Calendar.
- `calendar-events/`, `calendar/diagnostic/` : lecture/diag calendrier.

**Analytique**
- `analytics/vacations/`, `analytics/vacations.csv/`, `analytics/source-check/`.

**Cron** (déclenchés par Vercel — voir §8) : `cron/daily-dispatcher`,
`cron/monthly-vacation-summary`, `cron/health-watch`, `cron/sync-forbidden-windows`,
`cron/check-pending-requests`, `cron/pending-requests-{3d,7d}`, `cron/pending-reminder-5d`,
`cron/monthly-csv`, `cron/cleanup-test-requests`.

**Santé / debug** : `health/`, `debug/*`, `test-*` (diagnostics, à ne pas exposer).

> Convention : routes serveur en `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`,
> accès Firestore via `getFirebaseAdmin()`.

---

## 8. Tâches planifiées (Vercel Cron — `vercel.json`)

| Cron | Schedule (UTC) | Rôle |
|---|---|---|
| `daily-dispatcher` | `0 8 * * *` (8h/j) | Dispatch quotidien (relances demandes en attente) |
| `monthly-vacation-summary` | `0 1 27 * *` (le 27) | Récap mensuel des congés |
| `health-watch` | `0 9 * * *` (9h/j) | Surveillance de santé / alertes |
| `sync-forbidden-windows` | `0 2 1 * *` (le 1er) | Scanne le calendrier Google 18 mois en avant, détecte les dates Top Marques/GP de l'année suivante absentes de `FORBIDDEN_WINDOWS` et **envoie un mail** à `pierre@stars.mc` avec le patch prêt à coller |

---

## 9. Système « dates interdites » & popup d'information

Deux mécanismes **liés mais distincts**, pilotés aujourd'hui par
`src/lib/forbiddenDates.ts` :

1. **Rejet automatique** : `overlapsForbiddenWindow(start, end)` rejette toute
   demande chevauchant une période de `FORBIDDEN_WINDOWS` (Top Marques, Grand Prix).
   Message localisé via `autoDenyMessage()`.
2. **Popup d'information** : `ForbiddenDatesNotice` (monté dans `[locale]/layout.tsx`)
   → `NoticeModal`, affichée une fois par session après login.

État actuel (2026-06) : la **popup est désactivée** (événements 2026 passés).
**Évolution en cours** (voir `docs/superpowers/specs/2026-06-12-admin-notice-settings-design.md`) :
déplacer la configuration de la **popup** vers **Administration → Options**
(Firestore `settings/forbiddenNotice` : périodes activables, dates, messages
trilingues), sans déploiement. Le **rejet automatique restera piloté par le code**.

> ⚠️ Après cette évolution : deux sources de dates (popup = Firestore admin /
> rejet auto = `FORBIDDEN_WINDOWS` code). Tenir les deux à jour.

---

## 10. Intégrations externes

- **Google Calendar** (`googleapis`, compte de service) : les congés validés sont
  poussés dans un calendrier ; un calendrier source est scanné pour les périodes
  d'événements. Variables `GOOGLE_CALENDAR_*`, `GCAL_*`.
- **Email** : envoi via **Gmail API** (OAuth : `GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN`)
  et/ou **SMTP** (`nodemailer`, `SMTP_*`). Expéditeur `MAIL_FROM`/`FROM_EMAIL`.
  Notifications : accusés, relances 3/5/7 jours, récap mensuel, alertes santé.
- **Firebase** : Firestore (données) + Firebase Admin (serveur).

---

## 11. Variables d'environnement (principales)

Regroupées par fonction (noms réellement référencés dans le code) :

- **Auth** : `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_ALLOW_DOMAIN`,
  `NEXTAUTH_ALLOW_EMAILS`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- **Firebase (client)** : `NEXT_PUBLIC_FIREBASE_*` (apiKey, authDomain, projectId,
  storageBucket, messagingSenderId, appId), `NEXT_PUBLIC_ENABLE_FIREBASE`.
- **Firebase (admin)** : `FIREBASE_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`,
  `FIREBASE_ADMIN_PRIVATE_KEY` (ou `FIREBASE_SERVICE_ACCOUNT_KEY`).
- **Google Calendar** : `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_SOURCE_ID`,
  `GOOGLE_CALENDAR_TARGET_ID`, `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY[_BASE64]`,
  `GCAL_CLIENT_EMAIL`, `GCAL_PRIVATE_KEY`, `GSUITE_IMPERSONATE`.
- **Email** : `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`,
  `GMAIL_REFRESH_TOKEN`, `GMAIL_APP_PASSWORD`, `SMTP_HOST/PORT/USER/PASS`,
  `MAIL_FROM`, `FROM_EMAIL`, `NOTIFY_ADMIN_EMAILS`, `ACCOUNTING_EMAIL`,
  `EMAIL_TEST_MODE`, `EMAIL_TEST_RECIPIENT`.
- **App** : `APP_BASE_URL`, `NEXT_PUBLIC_APP_URL`, `APP_TIMEZONE`,
  `DEFAULT_LEAVE_ENTITLEMENT`, `ADMIN_EMAILS`.

> Plusieurs variables Google/Gmail se recouvrent (héritage de migrations
> successives). `npm run env:check` valide la présence des variables requises.
> ⚠️ Ne jamais committer de clé : `firebase-key.json` et fichiers `*.json`/`.env*`
> sensibles doivent rester gitignorés.

---

## 12. Développement local

```bash
npm install
npm run env:check        # vérifie les variables d'environnement
npm run dev              # serveur de dev (localhost:3000)
npm run dev:ready        # dev + attente health
```

Qualité / tests :
```bash
npm run lint             # eslint
npm run build:check      # lint:fix + next build
npm run test             # vitest (unit)
npm run test:e2e         # Playwright
npm run knip / tsprune / depcheck   # détection code/déps morts
```

---

## 13. Déploiement (Vercel)

- Projet : **`stars_vacation_management_v2`** (team `pierres-projects-bba7ee64`).
- Workflow : **preview d'abord** (`vercel deploy --yes`) → validation → **prod**
  (`vercel deploy --prod --yes`).
- En cas de régression prod : `vercel rollback`.
- Crons configurés dans `vercel.json` (voir §8).
- Avant déploiement : vérifier l'absence de fichiers sensibles non-gitignorés.

---

## 14. Conventions

- **i18n** : créer simultanément les 3 entrées `fr`/`en`/`it` pour toute string.
- **Git** : branches `feat/…` `fix/…` ; jamais de `git add -A` aveugle ; commits
  ciblés ; pas de merge direct sur `main` sans validation.
- **Charte Stars** : Montserrat, neutres (ink/cream/slate) + doré `#D8B11B` en accent ;
  palette sémantique muted (succès `#5C7C5A`, warning `#B8902E`, danger `#A23B2D`).
- **Sécurité** : gardes `isAdmin/isFullAdmin` sur tout endpoint sensible ;
  rendu des messages en texte (pas de HTML injecté).
