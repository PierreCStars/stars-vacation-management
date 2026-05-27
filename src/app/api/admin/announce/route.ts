export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getAdminEmails, sendEmailToRecipients } from '@/lib/email-notifications';
import { renderSlgEmail } from '@/lib/email/slg-theme';

/**
 * One-off admin announcement endpoint.
 * Guarded by a shared secret (ANNOUNCE_SECRET) — pass ?secret=... .
 * Sends an SLG-branded update notice to all admin recipients.
 *
 * Temporary: remove after the announcement is sent.
 */
function buildEmail() {
  const subject = "Mise à jour de l'outil de gestion des congés";
  const bodyHtml = `
    <tr><td style="padding:0 0 16px;">Bonjour,</td></tr>
    <tr><td style="padding:0 0 16px;">L'outil de gestion des congés a été mis à jour. Son fonctionnement n'a pas changé, mais certaines fonctionnalités ont été ajoutées :</td></tr>
    <tr><td style="padding:0 0 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid rgba(10,10,10,0.06);font-size:15px;color:#0A0A0A;">
          <span style="color:#D8B11B;font-weight:700;">•</span>&nbsp; Possibilité de supprimer une requête (en cas d'erreur par exemple)
        </td></tr>
        <tr><td style="padding:8px 0;font-size:15px;color:#0A0A0A;">
          <span style="color:#D8B11B;font-weight:700;">•</span>&nbsp; Analytics repensés pour une meilleure visibilité des comportements de chacun
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding:16px 0 0;">Merci</td></tr>
  `;

  const html = renderSlgEmail({
    title: subject,
    eyebrow: 'Mise à jour',
    heading: "L'outil de gestion des congés évolue",
    accent: 'gold',
    bodyHtml,
    preheader: "Nouvelles fonctionnalités : suppression de requête + analytics repensés",
  });

  const text = `Bonjour,

L'outil de gestion des congés a été mis à jour. Son fonctionnement n'a pas changé, mais certaines fonctionnalités ont été ajoutées :

• Possibilité de supprimer une requête (en cas d'erreur par exemple)
• Analytics repensés pour une meilleure visibilité des comportements de chacun.

Merci`;

  return { subject, html, text };
}

async function handle(req: Request) {
  const secret = new URL(req.url).searchParams.get('secret');
  const expected = process.env.ANNOUNCE_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const recipients = getAdminEmails();
  const { subject, html, text } = buildEmail();
  const result = await sendEmailToRecipients(recipients, subject, html, text);

  return NextResponse.json({
    success: result.success,
    recipients,
    provider: result.provider,
    error: result.error,
  });
}

export async function POST(req: Request) {
  return handle(req);
}
