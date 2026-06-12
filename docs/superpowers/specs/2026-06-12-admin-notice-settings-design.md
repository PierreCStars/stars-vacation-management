# Spec — Réglages admin de la popup d'information (Top Marques / GP / périodes bloquées)

Date : 2026-06-12
Projet : Stars Vacation Management (`stars_vacation_management_v2`)

## Contexte & problème

La popup d'information affichée à l'ouverture (annonçant les périodes Top Marques /
Grand Prix pendant lesquelles aucune demande de congés n'est acceptée) est
aujourd'hui pilotée par des constantes **codées en dur** dans
`src/lib/forbiddenDates.ts` (`FORBIDDEN_WINDOWS`, `MODAL_TEXT`) et un flag
`SHOW_FORBIDDEN_NOTICE`. Toute mise à jour exige un commit + déploiement.

Objectif : permettre aux **administrateurs** de gérer la popup depuis l'interface,
sans déploiement, via une nouvelle page **Administration → Options**.

## Décisions actées (brainstorming)

1. **Périmètre : popup uniquement.** Le réglage admin ne pilote QUE l'affichage de
   la popup. Le **rejet automatique** des demandes reste piloté par
   `FORBIDDEN_WINDOWS` dans le code (inchangé).
   ⚠️ Conséquence assumée : deux sources de dates distinctes (popup = Firestore /
   rejet auto = code). À documenter dans le code.
2. **Plusieurs périodes** gérables (liste de N fenêtres).
3. **Messages trilingues** FR / EN / IT.
4. **Placement UI** : nouvelle page sous **Administration → Options**
   (`/[locale]/admin/options`), nouvel item de menu dans `AdminDropdown`.

## Modèle de données (Firestore)

Document unique : collection `settings`, doc `forbiddenNotice`.

```ts
type NoticeWindow = {
  id: string;            // uuid généré côté client à la création
  enabled: boolean;      // activation individuelle
  label: string;         // libellé interne (ex. "Top Marques 2027")
  startDate: string;     // 'YYYY-MM-DD' (inclus)
  endDate: string;       // 'YYYY-MM-DD' (inclus)
  message: { fr: string; en: string; it: string };
};

type ForbiddenNoticeSettings = {
  windows: NoticeWindow[];
  updatedAt: string;     // ISO
  updatedBy: string;     // email admin
};
```

## Logique d'affichage

Une période est **active** si `enabled === true` ET la date du jour (UTC, jour-précis)
est dans `[startDate, endDate]` inclus. La popup s'affiche s'il existe ≥ 1 période
active ; les messages des périodes actives sont **empilés** (séparés visuellement).
Le message est rendu dans la langue de l'utilisateur (`fr`/`en`/`it`, fallback `en`).
Comportement « une fois par session » conservé (garde `sessionStorage`).

La comparaison de dates réutilise les helpers jour-précis UTC déjà présents dans
`forbiddenDates.ts` (`parseDay`, `toUtcDay`), extraits/partagés si besoin.

## API

- `GET /api/forbidden-notice`
  - Auth : **tout utilisateur connecté** (`getServerSession`).
  - Calcule côté serveur les périodes actives du jour, renvoie
    `{ active: Array<{ id, message: {fr,en,it} }> }`. Ne renvoie JAMAIS les périodes
    inactives/futures (pas de fuite d'info).
  - `Cache-Control: no-store`.
- `GET /api/admin/forbidden-notice`
  - Auth : **admin** (`isFullAdmin`). Renvoie la config complète (toutes les périodes).
- `PUT /api/admin/forbidden-notice`
  - Auth : **admin** (`isFullAdmin`). Body = `{ windows: NoticeWindow[] }`.
  - **Validation serveur** : dates au format `YYYY-MM-DD`, `startDate <= endDate`,
    `label` non vide, au moins le message `en` non vide (fr/it peuvent fallback),
    `enabled` booléen, max 20 périodes. Rejette 400 sinon.
  - Écrit le doc avec `updatedAt`/`updatedBy` (email session).

Toutes les routes : `runtime = 'nodejs'`, `dynamic = 'force-dynamic'`.
Accès Firestore via `getFirebaseAdmin()` (gère le cas Firebase désactivé → réponse vide).

## UI admin — `/[locale]/admin/options`

- Page server (`page.tsx`, `runtime=nodejs`, `dynamic=force-dynamic`) →
  composant client `AdminOptionsClient.tsx`.
- Garde d'accès : redirection/erreur si `!isFullAdmin(session.email)` (aligné sur
  les autres pages admin).
- Contenu : section « Périodes d'information » :
  - Liste de cartes, une par période : toggle **Activé**, champ **Libellé**,
    **Date début** (`<input type="date">`), **Date fin**, 3 zones de texte
    **Message FR / EN / IT**.
  - Boutons **Ajouter une période** / **Supprimer** (par carte).
  - Bouton **Enregistrer** → `PUT`, avec état de chargement + toast succès/erreur.
  - Validation côté client en miroir de l'API (dates cohérentes, libellé requis).
- Labels d'interface **trilingues** (clés ajoutées dans `src/locales/{fr,en,it}.json`,
  namespace `adminOptions`).
- Style : composants/classes existants (cartes `bg-white shadow-card`, `btn-secondary`,
  palette Stars). Pas de nouvelle dépendance.

## Navigation

`src/components/nav/AdminDropdown.tsx` : ajouter un item **Options**
(`/admin/options`) dans la section Management, clé i18n `nav.options`
(FR « Options », EN « Options », IT « Opzioni »). Mettre à jour `hasActiveChild`
et `isActive` pour inclure `/admin/options`.

## Composant popup — modifications

- `ForbiddenDatesNotice.tsx` : remplacer le flag `SHOW_FORBIDDEN_NOTICE` par un
  `fetch('/api/forbidden-notice')` (au montage, après auth). S'il y a ≥ 1 période
  active et que la notice n'a pas déjà été montrée dans la session, afficher la
  modale. Conserver la clé `sessionStorage` (renommée `forbidden-notice-shown`).
- `NoticeModal.tsx` : accepter une **liste de messages** (au lieu d'un seul texte)
  et les empiler. Toujours localisé.
- `forbiddenDates.ts` : retirer `SHOW_FORBIDDEN_NOTICE`. **Conserver**
  `FORBIDDEN_WINDOWS`, `overlapsForbiddenWindow`, `autoDenyMessage` (rejet auto, hors
  périmètre). Exposer les helpers de date partagés.

## Seed / migration

Au premier `GET /api/admin/forbidden-notice` si le doc n'existe pas : renvoyer une
config par défaut (non persistée) contenant les 2 périodes existantes
(Top Marques, Grand Prix) avec leurs dates 2026 actuelles, `enabled: false`, et les
messages trilingues repris de `MODAL_TEXT` — comme gabarit prêt pour 2027.
La persistance se fait au premier **Enregistrer** de l'admin.

## Sécurité / robustesse

- Lecture publique (`/api/forbidden-notice`) restreinte aux périodes actives → aucune
  donnée future/désactivée exposée.
- Écriture réservée `isFullAdmin` ; validation stricte côté serveur.
- Firebase désactivé / erreur → `GET /api/forbidden-notice` renvoie `{ active: [] }`
  (la popup ne casse jamais l'app).
- XSS : le message est rendu en texte (pas de `dangerouslySetInnerHTML`).

## Hors périmètre

- Rejet automatique des demandes (`FORBIDDEN_WINDOWS`) — inchangé.
- Cron `sync-forbidden-windows` — inchangé (continue d'alerter sur les dates code).
- Pas de couplage popup ↔ rejet auto dans cette itération.

## Tests / vérification

- Unitaire : fonction « période active » (dans/hors fenêtre, désactivée, multi-actives,
  bornes inclusives, dates invalides).
- API : `PUT` rejette dates incohérentes / non-admin (401/403/400).
- Manuel : créer une période active → popup s'affiche dans les 3 langues ; désactiver →
  ne s'affiche plus ; build + typecheck OK.
