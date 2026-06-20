export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

/**
 * Internal webhook hit by `.github/workflows/ci-failure-notify.yml` whenever
 * the CI workflow finishes with a non-success conclusion on `main` or on a
 * pull-request.
 *
 * Auth: shared secret in the `Authorization: Bearer …` header, matched
 * against `CI_ALERT_SECRET` (set in both Vercel env and GitHub Actions
 * secrets). Anything else returns 401, so the URL alone is harmless if it
 * leaks.
 *
 * Behaviour: send a single SMTP alert to pierre@stars.mc with the run URL,
 * the failing commit, and the branch. No persisted state — the cooldown
 * is enforced by the *workflow itself* (only sends on the run that JUST
 * failed, so spam is bounded by how often Pierre pushes).
 */

const OPS_RECIPIENT = 'pierre@stars.mc';

type Payload = {
  workflow?: string;
  conclusion?: string; // 'failure' | 'cancelled' | 'timed_out' | …
  branch?: string;
  sha?: string;
  runUrl?: string;
  actor?: string;
  attempt?: number;
};

export async function POST(req: Request) {
  // Shared-secret check (Bearer token).
  const auth = req.headers.get('authorization') || '';
  const expected = process.env.CI_ALERT_SECRET;
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'CI_ALERT_SECRET not configured on this deployment' },
      { status: 500 },
    );
  }
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!provided || provided !== expected) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    /* tolerate empty body */
  }

  // The workflow only calls us on non-success, but double-guard anyway.
  if (body.conclusion === 'success') {
    return NextResponse.json({ ok: true, skipped: 'success-noop' });
  }

  const subject = `[Stars Vacation] CI ${body.conclusion || 'failed'} on ${body.branch || 'unknown branch'}`;
  const text = [
    'A CI run on stars-vacation-management just finished with a non-success conclusion.',
    '',
    `Workflow:   ${body.workflow || 'CI'}`,
    `Conclusion: ${body.conclusion || 'unknown'}`,
    `Branch:     ${body.branch || 'unknown'}`,
    `Commit:     ${body.sha || 'unknown'}`,
    `Actor:      ${body.actor || 'unknown'}`,
    `Attempt:    ${body.attempt ?? 'unknown'}`,
    '',
    `Run URL:    ${body.runUrl || 'unknown'}`,
    '',
    'Branch protection on main is set with enforce_admins=true, so this',
    'failure blocks the merge button for everyone — including admins.',
    'Re-push a fix and the alert stops (no email on success).',
    '',
    '— Stars Vacation Management · CI failure watcher',
  ].join('\n');

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT || 465),
      secure: true,
      auth: { user: process.env.SMTP_USER!, pass: process.env.SMTP_PASS! },
    });
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'no-reply@stars.mc',
      to: OPS_RECIPIENT,
      subject,
      text,
    });
    return NextResponse.json({ ok: true, emailSent: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ci-failure-alert] SMTP send failed:', message);
    return NextResponse.json({ ok: false, emailError: message }, { status: 500 });
  }
}
