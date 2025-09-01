export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { listEventsInRange } from '@/lib/google-calendar';

export async function GET(req: Request) {
  try {
    // Handle build-time scenario where req.url might be undefined
    if (!req.url) {
      return NextResponse.json({
        events: [],
        error: 'Request URL not available during build time'
      }, { status: 400 });
    }

    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') || 90);
    const calId = process.env.GOOGLE_CALENDAR_SOURCE_ID;
    
    if (!calId) {
      return NextResponse.json(
        { events: [], error: 'Missing GOOGLE_CALENDAR_SOURCE_ID' }, 
        { status: 200 }
      );
    }

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 3600 * 1000);

    const events = await listEventsInRange(calId, now.toISOString(), end.toISOString());

    // Normalize payload; fix all-day exclusive end date
    const list = events.map(ev => {
      const start = ev.start?.date || ev.start?.dateTime?.slice(0, 10) || '';
      const endRaw = ev.end?.date || ev.end?.dateTime?.slice(0, 10) || start;
      const endInc = ev.end?.date ? 
        new Date(new Date(endRaw).getTime() - 86400000).toISOString().slice(0, 10) : 
        endRaw;
      
      return {
        id: ev.id,
        title: ev.summary || '(Untitled)',
        startDate: start,
        endDate: endInc,
        location: ev.location || ''
      };
    });

    return NextResponse.json({ events: list });
  } catch (error) {
    console.error('Error fetching source calendar events:', error);
    return NextResponse.json(
      { events: [], error: 'Failed to fetch calendar events' }, 
      { status: 500 }
    );
  }
}
