export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { calendarClient, CAL_SOURCE } from '@/lib/google-calendar';
import { FORBIDDEN_WINDOWS } from '@/lib/forbiddenDates';

const OPS_RECIPIENT = 'pierre@stars.mc';

/**
 * Cron-triggered watcher for the year-specific forbidden windows
 * (Top Marques, Grand Prix Monaco, Yacht Show, etc).
 *
 * The dates are still hardcoded in `src/lib/forbiddenDates.ts` so the runtime
 * stays synchronous and safe. This cron looks at the company-events calendar
 * 18 months ahead, builds candidate windows from event titles matching the
 * known patterns, and emails pierre@stars.mc whenever the calendar surfaces
 * a window that isn't yet in `FORBIDDEN_WINDOWS` — typically next year's
 * dates appearing as the current year wraps up.
 *
 * Schedule (see vercel.json): once a month at 02:00 UTC. The mail includes
 * a copy-pasteable code patch so the next update is a 30-second commit.
 */

type CandidateWindow = {
  label: string;
  start: string; // YYYY-MM-DD
  end: string;
};

const PATTERNS: Array<{ label: string; regex: RegExp }> = [
  { label: 'Top Marques', regex: /top\s*marques/i },
  { label: 'Grand Prix', regex: /(?:formula\s*1|grand\s*prix|f1)/i },
];

/** Format a Google Calendar event date/dateTime to local YYYY-MM-DD. */
function toYMD(
  d: { date?: string | null; dateTime?: string | null } | null | undefined,
): string | null {
  if (!d) return null;
  if (d.date) return d.date; // all-day event
  if (d.dateTime) return d.dateTime.slice(0, 10); // ISO timestamp
  return null;
}

export async function GET() {
  if (!CAL_SOURCE) {
    return NextResponse.json(
      { ok: false, reason: 'GOOGLE_CALENDAR_SOURCE_ID is not set — nothing to scan.' },
      { status: 200 },
    );
  }

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMaxDate = new Date(now);
  timeMaxDate.setUTCMonth(timeMaxDate.getUTCMonth() + 18);
  const timeMax = timeMaxDate.toISOString();

  type CalEvent = {
    summary?: string | null;
    start?: { date?: string | null; dateTime?: string | null } | null;
    end?: { date?: string | null; dateTime?: string | null } | null;
  };
  let events: CalEvent[] = [];

  try {
    const cal = calendarClient();
    const res = await cal.events.list({
      calendarId: CAL_SOURCE,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });
    events = res.data.items || [];
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error('[sync-forbidden-windows] calendar fetch failed:', error);
    return NextResponse.json({ ok: false, error }, { status: 200 });
  }

  // Build the candidate list from events matching one of the known patterns.
  const candidates: CandidateWindow[] = [];
  for (const ev of events) {
    const title = ev.summary || '';
    const match = PATTERNS.find(p => p.regex.test(title));
    if (!match) continue;
    const start = toYMD(ev.start);
    const end = toYMD(ev.end);
    if (!start || !end) continue;
    // Google all-day end dates are exclusive: subtract 1 day to make inclusive.
    let inclusiveEnd = end;
    if (ev.end?.date) {
      const [y, m, d] = end.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d - 1));
      inclusiveEnd = dt.toISOString().slice(0, 10);
    }
    candidates.push({ label: match.label, start, end: inclusiveEnd });
  }

  // Find candidates that don't exist in the hardcoded list.
  const known = new Set(
    FORBIDDEN_WINDOWS.map(w => `${w.label}|${w.start}|${w.end}`),
  );
  const missing = candidates.filter(
    c => !known.has(`${c.label}|${c.start}|${c.end}`),
  );

  if (missing.length === 0) {
    return NextResponse.json({
      ok: true,
      candidates,
      missing: [],
      message: 'All upcoming windows already present in FORBIDDEN_WINDOWS — nothing to do.',
    });
  }

  // Build a copy-pasteable patch suggestion + email pierre.
  const allRows = [...FORBIDDEN_WINDOWS, ...missing].sort((a, b) =>
    a.start.localeCompare(b.start),
  );
  const patch = [
    'export const FORBIDDEN_WINDOWS = [',
    ...allRows.map(
      r => `  { label: '${r.label}', start: '${r.start}', end: '${r.end}' },`,
    ),
    '] as const;',
  ].join('\n');

  const subject = `[Stars Vacation] ${missing.length} new forbidden window(s) detected`;
  const text = [
    'The forbidden-windows watcher found events on the company calendar that are not yet in src/lib/forbiddenDates.ts:',
    '',
    ...missing.map(m => `  • ${m.label}: ${m.start} → ${m.end}`),
    '',
    'Suggested updated FORBIDDEN_WINDOWS (sorted by start date) — copy-paste into src/lib/forbiddenDates.ts:',
    '',
    patch,
    '',
    'Reminder: the localised MODAL_TEXT / DENY_TEXT below the array still hard-codes the dates in human form — update those strings too in FR / EN / IT.',
    '',
    '— Stars Vacation Management · forbidden-windows watcher',
  ].join('\n');

  let emailSent = false;
  let emailError: string | null = null;
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
    emailSent = true;
  } catch (err) {
    emailError = err instanceof Error ? err.message : String(err);
    console.error('[sync-forbidden-windows] email send failed:', emailError);
  }

  return NextResponse.json({
    ok: true,
    candidates,
    missing,
    emailSent,
    emailError,
  });
}
