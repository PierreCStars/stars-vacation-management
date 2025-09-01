export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { safeTrim, safeStartsWith } from '@/lib/strings';

// Utility function to load and parse Google credentials
function loadGoogleCreds() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY manquante");

  // 1) Si c'est du JSON (cas recommandé en .env)
  if (safeStartsWith(raw, "{")) {
    const obj = JSON.parse(raw);
    if (!obj.client_email || !obj.private_key) {
      throw new Error("Clé de service Google invalide (champs manquants)");
    }
    // Remettre de vrais retours à la ligne
    obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
    return { client_email: obj.client_email, private_key: obj.private_key };
  }

  // 2) Si quelqu'un a mis directement le PEM dans la variable
  const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
  return { client_email: process.env.GOOGLE_CLIENT_EMAIL!, private_key: pem };
}

export async function GET(request: NextRequest) {
  try {
    // Handle build-time scenario where request.url might be undefined
    if (!request.url) {
      return NextResponse.json({
        success: false,
        error: 'Request URL not available during build time',
        events: []
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      credentials: loadGoogleCreds(),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    // Set default time range if not provided
    const now = new Date();
    const startDate = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = timeMax ? new Date(timeMax) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('📅 Fetching calendar events...');
    console.log('📅 Calendar ID:', calendarId);
    console.log('📅 Time range:', startDate.toISOString(), 'to', endDate.toISOString());

    const response = await calendar.events.list({
      calendarId: calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    console.log(`✅ Found ${events.length} calendar events`);

    // Filter and format events to only show vacation events
    const vacationEvents = events
      .filter(event => {
        // Only show events that are vacation-related
        const summary = event.summary || '';
        const description = event.description || '';
        return summary.includes(' - ') || description.includes('Company:') || description.includes('Name:');
      })
      .map(event => {
        // Extract company and user info from event summary or description
        const summary = event.summary || '';
        const description = event.description || '';
        
        let company = 'UNKNOWN';
        let userName = 'Unknown User';
        
        // Try to extract company from summary (format: "UserName - CompanyName")
        if (summary.includes(' - ')) {
          const parts = summary.split(' - ');
          if (parts.length >= 2) {
            userName = safeTrim(parts[0], 'Unknown User');
            company = safeTrim(parts[1], 'UNKNOWN');
          }
        }
        
        // Try to extract from description if summary parsing failed
        if (company === 'UNKNOWN' && description.includes('Company:')) {
          const companyMatch = description.match(/Company:\s*([^\n]+)/);
          if (companyMatch) {
            company = safeTrim(companyMatch[1], 'UNKNOWN');
          }
        }
        
        if (userName === 'Unknown User' && description.includes('Name:')) {
          const nameMatch = description.match(/Name:\s*([^\n]+)/);
          if (nameMatch) {
            userName = safeTrim(nameMatch[1], 'Unknown User');
          }
        }

        return {
          id: event.id,
          summary: event.summary,
          description: event.description,
          start: event.start?.date || event.start?.dateTime,
          end: event.end?.date || event.end?.dateTime,
          colorId: event.colorId,
          company: company,
          userName: userName,
          htmlLink: event.htmlLink,
        };
      });

    console.log(`✅ Filtered to ${vacationEvents.length} vacation events`);

    return NextResponse.json({
      success: true,
      events: vacationEvents,
      totalEvents: events.length,
      vacationEvents: vacationEvents.length,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching calendar events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch calendar events' 
      },
      { status: 500 }
    );
  }
}


