export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import { generateReminderEmail } from '@/lib/cron/pendingReminder5d';
import { sendEmailToRecipients } from '@/lib/email-notifications';

/**
 * Envoi de TEST du mail de relance « congés en attente », à UN SEUL
 * destinataire (par défaut l'admin connecté) — pour vérifier le rendu charte
 * sans spammer les autres admins. Admin uniquement.
 * Usage : GET /api/admin/test-reminder-email[?to=email]
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const to = req.nextUrl.searchParams.get('to') || email;

  const now = new Date();
  const sample = generateReminderEmail([
    {
      id: 'sample-1', userName: 'Sacha Panero', userEmail: 'sacha@stars.mc',
      company: 'STARS_MC', type: 'Congés payés', startDate: '2026-07-06', endDate: '2026-07-10',
      durationDays: 5, reason: 'Vacances', createdAt: now, submittedDate: '2026-06-12',
    },
    {
      id: 'sample-2', userName: 'Sarah Dansou', userEmail: 'sarah@stars.mc',
      company: 'STARS_REAL_ESTATE', type: 'Récupération', startDate: '2026-07-08', endDate: '2026-07-08',
      durationDays: 1, reason: '', createdAt: now, submittedDate: '2026-06-13',
    },
  ]);

  const result = await sendEmailToRecipients([to], `[TEST] ${sample.subject}`, sample.html, sample.text);
  return NextResponse.json({ ok: result.success, sentTo: to, subject: `[TEST] ${sample.subject}`, result });
}
