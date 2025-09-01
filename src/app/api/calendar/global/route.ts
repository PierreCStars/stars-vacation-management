export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';

// Mock data for now - replace with actual Google Calendar integration
const mockEvents = [
  {
    id: '1',
    title: 'Johnny Vacation',
    startDate: '2025-09-15',
    endDate: '2025-09-17',
    location: 'Stars Yachting'
  },
  {
    id: '2',
    title: 'Daniel Half Day',
    startDate: '2025-09-20',
    endDate: '2025-09-20',
    location: 'Stars Real Estate'
  },
  {
    id: '3',
    title: 'Pierre Vacation',
    startDate: '2025-10-01',
    endDate: '2025-10-05',
    location: 'Stars MC'
  },
  {
    id: '4',
    title: 'Team Holiday',
    startDate: '2025-12-24',
    endDate: '2025-12-24',
    location: 'All Companies'
  }
];

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
    const days = Number(url.searchParams.get('days') || 60);
    
    // For now, return mock data
    // TODO: Integrate with Google Calendar API
    // const calId = process.env.GOOGLE_CALENDAR_TARGET_ID;
    // if (!calId) return NextResponse.json({events: [], error: 'Missing GOOGLE_CALENDAR_TARGET_ID'}, {status: 200});

    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 3600 * 1000);
    
    // Filter events within the date range
    const events = mockEvents.filter(event => {
      const eventStart = new Date(event.startDate);
      return eventStart >= now && eventStart <= end;
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in global calendar route:', error);
    return NextResponse.json({
      events: [],
      error: 'Failed to fetch calendar events'
    }, { status: 500 });
  }
}
