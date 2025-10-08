import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Utility function to load and parse Google credentials
function loadGoogleCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY manquante");

  if (raw.trim().startsWith("{")) {
    const obj = JSON.parse(raw);
    if (!obj.client_email || !obj.private_key) {
      throw new Error("Clé de service Google invalide (champs manquants)");
    }
    obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
    return { client_email: obj.client_email, private_key: obj.private_key };
  }

  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL!, private_key: pem };
}

export async function POST() {
  try {
    console.log('🧪 Testing Google Calendar event creation...');
    
    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      credentials: loadGoogleCreds(),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_TARGET_ID || 'primary';
    
    console.log('📅 Calendar ID:', calendarId);
    
    // Create a test event
    const testEvent = {
      summary: 'Test Vacation Event',
      description: 'This is a test event to verify Google Calendar integration',
      start: {
        date: '2025-12-31',
        timeZone: 'UTC',
      },
      end: {
        date: '2026-01-01',
        timeZone: 'UTC',
      },
    };

    console.log('📝 Creating test event...');
    const response = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: testEvent,
    });

    console.log('✅ Test event created:', response.data.id);
    
    // List events to verify
    console.log('📋 Listing events...');
    const listResponse = await calendar.events.list({
      calendarId: calendarId,
      timeMin: '2025-12-01T00:00:00Z',
      timeMax: '2026-01-31T23:59:59Z',
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = listResponse.data.items || [];
    console.log(`📊 Found ${events.length} events in calendar`);

    return NextResponse.json({
      success: true,
      testEventId: response.data.id,
      calendarId: calendarId,
      eventsFound: events.length,
      events: events.map(event => ({
        id: event.id,
        summary: event.summary,
        start: event.start?.date || event.start?.dateTime,
        end: event.end?.date || event.end?.dateTime,
      })),
      message: 'Test event created successfully'
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Test event creation failed'
    }, { status: 500 });
  }
}
