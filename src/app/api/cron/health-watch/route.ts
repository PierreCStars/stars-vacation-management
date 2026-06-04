export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Operational alerts mailbox — all management/automation emails go ONLY to
 * pierre@stars.mc (per the project rule: "tous les emails de gestion de cet
 * outil sont à adresser UNIQUEMENT à pierre@stars.mc").
 */
const OPS_RECIPIENT = 'pierre@stars.mc';

/**
 * Cron-triggered health probe.
 *
 * Hits the live `/api/health` endpoint and, if the response is not 200 OK
 * or reports `status !== 'ok'`, fires a one-shot email to the ops mailbox.
 *
 * Triggered by Vercel cron (see `vercel.json`). Manual trigger via GET works
 * too — useful for testing. No state is persisted between runs, so an
 * outage that spans several cron windows produces multiple alerts; that's
 * intentional (better noisy than silent).
 */
export async function GET() {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://starsvacationmanagementv2.vercel.app');

  const probeUrl = `${base}/api/health`;
  const startedAt = Date.now();

  let httpStatus = 0;
  let payload: unknown = null;
  let error: string | null = null;

  try {
    const res = await fetch(probeUrl, { cache: 'no-store' });
    httpStatus = res.status;
    payload = await res.json().catch(() => null);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  const durationMs = Date.now() - startedAt;
  const ok =
    httpStatus === 200 &&
    payload &&
    typeof payload === 'object' &&
    (payload as { status?: string }).status === 'ok';

  if (ok) {
    return NextResponse.json({
      ok: true,
      probeUrl,
      httpStatus,
      durationMs,
    });
  }

  // Probe failed — alert ops via SMTP.
  let emailSent = false;
  let emailError: string | null = null;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });

    const subject = `[Stars Vacation] Health check failed (${httpStatus || 'no response'})`;
    const text = [
      'The Stars Vacation Management health check just failed.',
      '',
      `Probe URL: ${probeUrl}`,
      `HTTP status: ${httpStatus || 'no response'}`,
      `Duration: ${durationMs} ms`,
      error ? `Error: ${error}` : '',
      '',
      'Last payload received:',
      JSON.stringify(payload, null, 2),
      '',
      '— Stars Vacation Management health watcher',
    ]
      .filter(Boolean)
      .join('\n');

    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@stars.mc',
      to: OPS_RECIPIENT,
      subject,
      text,
    });
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error('[HEALTH-WATCH] Failed to send alert email:', emailError);
  }

  return NextResponse.json(
    {
      ok: false,
      probeUrl,
      httpStatus,
      durationMs,
      probeError: error,
      payload,
      emailSent,
      emailError,
    },
    { status: 200 }, // Always 200 so Vercel cron doesn't retry & spam the inbox.
  );
}
