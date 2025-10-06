import { NextResponse } from 'next/server';
import { __clearFakeCalendar } from '@/lib/calendar/fake';

export async function GET() {
  if (process.env.E2E_USE_FAKE !== '1') return NextResponse.json({}, { status: 404 });
  __clearFakeCalendar();
  return NextResponse.json({ ok: true });
}







