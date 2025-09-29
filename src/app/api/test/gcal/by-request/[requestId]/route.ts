import { NextResponse } from 'next/server';
import { __getFakeCalendarStore } from '@/lib/calendar/fake';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  if (process.env.E2E_USE_FAKE !== '1') return NextResponse.json({}, { status: 404 });
  
  const { requestId } = await params;
  const store = __getFakeCalendarStore();
  const event = store.get(requestId);
  
  return NextResponse.json({ 
    exists: !!event,
    event: event || null
  });
}
