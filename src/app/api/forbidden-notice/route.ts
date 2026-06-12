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
