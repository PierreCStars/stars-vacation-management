import { NextResponse } from 'next/server';
import { clearInbox } from '@/lib/email/fake';

export async function GET() {
  if (process.env.E2E_USE_FAKE !== '1') return NextResponse.json({}, { status: 404 });
  clearInbox();
  return NextResponse.json({ ok: true });
}









