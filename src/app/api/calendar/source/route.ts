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
    // Google Calendar uses exclusive end dates for all-day events
    const list = events.map(ev => {
      const isAllDay = !!(ev.start?.date && !ev.start?.dateTime);
      const start = ev.start?.date || ev.start?.dateTime?.slice(0, 10) || '';
      let endDate = ev.end?.date || ev.end?.dateTime?.slice(0, 10) || '';
      
      // For all-day events, convert exclusive end date to inclusive
      if (isAllDay && endDate && endDate !== start) {
        // Subtract one day from exclusive end date to get inclusive end date
        const endDateObj = new Date(endDate + 'T00:00:00');
        endDateObj.setDate(endDateObj.getDate() - 1);
        const year = endDateObj.getFullYear();
        const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const day = String(endDateObj.getDate()).padStart(2, '0');
        endDate = `${year}-${month}-${day}`;
      } else if (isAllDay && (!endDate || endDate === start)) {
        // Single-day event: end date should equal start date
        endDate = start;
      }
      
      return {
        id: ev.id,
        title: ev.summary || '(Untitled)',
        startDate: start,
        endDate,
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
