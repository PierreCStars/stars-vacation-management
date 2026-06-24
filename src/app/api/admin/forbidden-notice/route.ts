export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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
