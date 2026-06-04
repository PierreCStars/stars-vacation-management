/**
 * Render every Stars-Vacation email template × 3 locales to static HTML files
 * under `.email-snapshots/`.
 *
 * Used by the CI workflow `.github/workflows/email-snapshots.yml` to surface
 * brand drift on emails before it ships — the artifact is downloadable from
 * each PR run.
 *
 * Run locally with: `npx tsx scripts/render-email-snapshots.ts`
 */

import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Stub the runtime URL helper so the snapshot doesn't depend on Vercel envs.
process.env.NEXT_PUBLIC_APP_URL ??= 'https://starsvacationmanagementv2.vercel.app';

import { renderSlgEmail, detailsTable, type EmailAccent } from '../src/lib/email/slg-theme';

const OUT_DIR = join(process.cwd(), '.email-snapshots');

type SampleSpec = {
  /** Unique slug used in the filename. */
  slug: string;
  /** "type" of email, shown in the snapshot index. */
  type: 'submission' | 'approved' | 'denied' | 'cancelled' | 'admin-notify';
  /** SLG accent applied to the heading / CTA. */
  accent: EmailAccent;
  /** Title (also used as preheader). */
  title: Record<'fr' | 'en' | 'it', string>;
  /** Uppercase eyebrow above the heading. */
  eyebrow: Record<'fr' | 'en' | 'it', string>;
  /** Heading line. */
  heading: Record<'fr' | 'en' | 'it', string>;
  /** Body paragraphs (joined with <p> tags). */
  paragraphs: Record<'fr' | 'en' | 'it', string[]>;
  /** Optional CTA. */
  cta?: { label: Record<'fr' | 'en' | 'it', string>; url: string };
};

/**
 * Representative fixture so each template snapshot is realistic. Real values
 * come from request data at runtime — these are just stand-ins.
 */
const FIXTURE = {
  requestId: 'req_demo_2026_0001',
  employee: 'Pierre Corbucci',
  company: 'STARS MC',
  type: { fr: 'Congé payé', en: 'Paid leave', it: 'Ferie pagate' },
  startDate: { fr: '04/09/2026', en: 'September 4, 2026', it: '04/09/2026' },
  endDate: { fr: '11/09/2026', en: 'September 11, 2026', it: '11/09/2026' },
  durationDays: 6,
  reason: {
    fr: 'Vacances de fin d’été en famille.',
    en: 'Late-summer family holiday.',
    it: 'Vacanze di fine estate in famiglia.',
  },
};

const LABEL = {
  request: { fr: 'Demande', en: 'Request', it: 'Richiesta' },
  employee: { fr: 'Employé', en: 'Employee', it: 'Dipendente' },
  company: { fr: 'Société', en: 'Company', it: 'Azienda' },
  type: { fr: 'Type', en: 'Type', it: 'Tipo' },
  dates: { fr: 'Période', en: 'Period', it: 'Periodo' },
  duration: { fr: 'Durée', en: 'Duration', it: 'Durata' },
  reason: { fr: 'Motif', en: 'Reason', it: 'Motivo' },
} as const;

const SAMPLES: SampleSpec[] = [
  {
    slug: 'admin-notify',
    type: 'admin-notify',
    accent: 'gold',
    title: {
      fr: 'Nouvelle demande de congé',
      en: 'New vacation request',
      it: 'Nuova richiesta di congedo',
    },
    eyebrow: { fr: 'NOUVELLE DEMANDE', en: 'NEW REQUEST', it: 'NUOVA RICHIESTA' },
    heading: {
      fr: `${FIXTURE.employee} — à examiner`,
      en: `${FIXTURE.employee} — awaiting review`,
      it: `${FIXTURE.employee} — in attesa di revisione`,
    },
    paragraphs: {
      fr: [`${FIXTURE.employee} a soumis une demande de congé.`, 'Examinez-la depuis l’espace administrateur.'],
      en: [`${FIXTURE.employee} has submitted a vacation request.`, 'Review it from the admin space.'],
      it: [`${FIXTURE.employee} ha inviato una richiesta di congedo.`, 'Esaminala dall’area amministratore.'],
    },
    cta: {
      label: { fr: 'Examiner la demande', en: 'Review request', it: 'Esamina la richiesta' },
      url: 'https://starsvacationmanagementv2.vercel.app/fr/admin/vacation-requests/req_demo',
    },
  },
  {
    slug: 'submission-confirmation',
    type: 'submission',
    accent: 'gold',
    title: {
      fr: 'Demande reçue',
      en: 'Request received',
      it: 'Richiesta ricevuta',
    },
    eyebrow: { fr: 'CONFIRMATION', en: 'CONFIRMATION', it: 'CONFERMA' },
    heading: {
      fr: 'Votre demande a été transmise',
      en: 'Your request has been received',
      it: 'La sua richiesta è stata ricevuta',
    },
    paragraphs: {
      fr: ['Votre demande de congé est en cours d’examen.', 'Vous serez notifié dès qu’une décision sera prise.'],
      en: ['Your vacation request is under review.', 'You will be notified as soon as a decision is made.'],
      it: ['La sua richiesta di ferie è in fase di revisione.', 'Sarà avvisato non appena verrà presa una decisione.'],
    },
  },
  {
    slug: 'decision-approved',
    type: 'approved',
    accent: 'green',
    title: { fr: 'Congé validé', en: 'Vacation approved', it: 'Congedo approvato' },
    eyebrow: { fr: 'VALIDÉ', en: 'APPROVED', it: 'APPROVATO' },
    heading: {
      fr: 'Votre congé est validé',
      en: 'Your vacation is approved',
      it: 'Le sue ferie sono approvate',
    },
    paragraphs: {
      fr: ['Bonne nouvelle : votre demande a été validée.', 'Le calendrier d’équipe est mis à jour automatiquement.'],
      en: ['Good news: your request has been approved.', 'The team calendar updates automatically.'],
      it: ['Buona notizia: la sua richiesta è stata approvata.', 'Il calendario del team viene aggiornato automaticamente.'],
    },
  },
  {
    slug: 'decision-denied',
    type: 'denied',
    accent: 'red',
    title: { fr: 'Congé refusé', en: 'Vacation denied', it: 'Congedo rifiutato' },
    eyebrow: { fr: 'REFUSÉ', en: 'DENIED', it: 'RIFIUTATO' },
    heading: {
      fr: 'Votre demande a été refusée',
      en: 'Your request has been denied',
      it: 'La sua richiesta è stata rifiutata',
    },
    paragraphs: {
      fr: ['Votre demande de congé n’a pas pu être validée.', 'N’hésitez pas à en discuter avec votre responsable.'],
      en: ['Your vacation request could not be approved.', 'Feel free to discuss it with your manager.'],
      it: ['La sua richiesta di ferie non è stata approvata.', 'Non esiti a discuterne con il suo responsabile.'],
    },
  },
  {
    slug: 'decision-cancelled',
    type: 'cancelled',
    accent: 'slate',
    title: { fr: 'Congé annulé', en: 'Vacation cancelled', it: 'Congedo annullato' },
    eyebrow: { fr: 'ANNULÉ', en: 'CANCELLED', it: 'ANNULLATO' },
    heading: {
      fr: 'Votre congé a été annulé',
      en: 'Your vacation was cancelled',
      it: 'Le sue ferie sono state annullate',
    },
    paragraphs: {
      fr: ['L’administrateur a annulé votre congé.', 'Le calendrier d’équipe a été mis à jour.'],
      en: ['An administrator has cancelled your vacation.', 'The team calendar has been updated.'],
      it: ['Un amministratore ha annullato il suo congedo.', 'Il calendario del team è stato aggiornato.'],
    },
  },
];

function detailsHtml(locale: 'fr' | 'en' | 'it') {
  return detailsTable([
    { label: LABEL.employee[locale], value: FIXTURE.employee },
    { label: LABEL.company[locale], value: FIXTURE.company },
    { label: LABEL.type[locale], value: FIXTURE.type[locale] },
    { label: LABEL.dates[locale], value: `${FIXTURE.startDate[locale]} → ${FIXTURE.endDate[locale]}` },
    {
      label: LABEL.duration[locale],
      value: locale === 'fr' ? `${FIXTURE.durationDays} jours` : locale === 'it' ? `${FIXTURE.durationDays} giorni` : `${FIXTURE.durationDays} days`,
    },
    { label: LABEL.reason[locale], value: FIXTURE.reason[locale] },
  ]);
}

function bodyHtml(spec: SampleSpec, locale: 'fr' | 'en' | 'it') {
  const paragraphs = spec.paragraphs[locale]
    .map(p => `<p style="margin:0 0 12px;color:#273341;line-height:1.55;">${p}</p>`)
    .join('');
  return paragraphs + detailsHtml(locale);
}

function snapshotPath(slug: string, locale: 'fr' | 'en' | 'it') {
  return join(OUT_DIR, `${slug}.${locale}.html`);
}

function writeSample(spec: SampleSpec, locale: 'fr' | 'en' | 'it') {
  const html = renderSlgEmail({
    title: spec.title[locale],
    eyebrow: spec.eyebrow[locale],
    heading: spec.heading[locale],
    accent: spec.accent,
    bodyHtml: bodyHtml(spec, locale),
    cta: spec.cta ? { label: spec.cta.label[locale], url: spec.cta.url } : undefined,
  });
  const file = snapshotPath(spec.slug, locale);
  writeFileSync(file, html, 'utf8');
  return file;
}

function writeIndex(files: string[]) {
  const indexHtml = [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8"><title>Stars Vacation — email snapshots</title>',
    '<style>body{font-family:system-ui;padding:24px;max-width:720px;margin:auto;}h1{font-weight:300;letter-spacing:.05em;text-transform:uppercase;}li{margin:.4em 0}a{color:#0A0A0A;border-bottom:1px solid #D8B11B;text-decoration:none}</style>',
    '</head><body>',
    '<h1>Email snapshots</h1>',
    `<p>${SAMPLES.length} templates × 3 locales = ${files.length} files. Open each to check brand consistency.</p>`,
    '<ul>',
    ...files
      .sort()
      .map(f => `<li><a href="./${f.split('/').pop()}">${f.split('/').pop()}</a></li>`),
    '</ul>',
    '</body></html>',
  ].join('\n');
  writeFileSync(join(OUT_DIR, 'index.html'), indexHtml, 'utf8');
}

function main() {
  rmSync(OUT_DIR, { recursive: true, force: true });
  mkdirSync(OUT_DIR, { recursive: true });

  const generated: string[] = [];
  for (const spec of SAMPLES) {
    for (const locale of ['fr', 'en', 'it'] as const) {
      generated.push(writeSample(spec, locale));
    }
  }
  writeIndex(generated);

  console.log(`✓ Wrote ${generated.length} email snapshots to ${OUT_DIR}`);
}

main();
