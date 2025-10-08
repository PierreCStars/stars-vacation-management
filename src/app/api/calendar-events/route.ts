export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { safeTrim, safeStartsWith } from '@/lib/strings';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationStatus } from '@/types/vacation-status';

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

// Fallback function to get only Firestore events when Google Calendar is not available
async function getFirestoreEventsOnly(includeVacationRequests: boolean) {
  let firestoreEvents: any[] = [];
  
  if (includeVacationRequests) {
    try {
      const { db } = getFirebaseAdmin();
      if (db) {
        const snapshot = await db
          .collection('vacationRequests')
          .get();
        
        // Filter approved requests using normalization
        const approvedRequests = snapshot.docs.filter(doc => {
          const data = doc.data();
          const normalizedStatus = normalizeVacationStatus(data.status);
          return normalizedStatus === 'approved';
        });
        
        firestoreEvents = approvedRequests.map(doc => {
          const data = doc.data();
          return {
            id: `firestore_${doc.id}`,
            summary: `${data.userName || 'Unknown'} - ${data.company || 'Unknown'}`,
            description: `Vacation Request\nName: ${data.userName || 'Unknown'}\nCompany: ${data.company || 'Unknown'}\nType: ${data.type || 'Full day'}\nReason: ${data.reason || 'N/A'}`,
            start: data.startDate,
            end: data.endDate,
            colorId: '2', // Green for approved vacation
            company: data.company || 'Unknown',
            userName: data.userName || 'Unknown',
            source: 'firestore',
            calendarEventId: data.calendarEventId || data.googleCalendarEventId
          };
        });
        console.log(`✅ Added ${firestoreEvents.length} Firestore vacation events`);
      }
    } catch (error) {
      console.error('[CALENDAR_API] firestore_error', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  return NextResponse.json({
    success: true,
    events: firestoreEvents,
    totalEvents: firestoreEvents.length,
    vacationEvents: 0,
    firestoreEvents: firestoreEvents.length,
    timeRange: {
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    console.log('[CALENDAR_API] start');
    
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
    const includeVacationRequests = searchParams.get('includeVacationRequests') !== 'false';

    // Check if Google Calendar credentials are available
    const hasGoogleCreds = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
                          process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 ||
                          (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
    
    if (!hasGoogleCreds) {
      console.log('[CALENDAR_API] Google Calendar credentials not available, returning Firestore events only');
      return await getFirestoreEventsOnly(includeVacationRequests);
    }

    // Initialize Google Calendar API
    let auth, calendar;
    try {
      auth = new google.auth.GoogleAuth({
        credentials: loadGoogleCreds(),
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });

      calendar = google.calendar({ version: 'v3', auth });
    } catch (authError) {
      console.error('[CALENDAR_API] Google Auth failed:', authError);
      return await getFirestoreEventsOnly(includeVacationRequests);
    }

    // Set default time range if not provided
    const now = new Date();
    const startDate = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = timeMax ? new Date(timeMax) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    console.log('📅 Fetching calendar events...');
    console.log('📅 Calendar ID:', calendarId);
    console.log('📅 Time range:', startDate.toISOString(), 'to', endDate.toISOString());

    let events: any[] = [];
    try {
      const response = await calendar.events.list({
        calendarId: calendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      events = response.data.items || [];
      console.log(`✅ Found ${events.length} calendar events`);
    } catch (calendarError) {
      console.error('[CALENDAR_API] Google Calendar API failed:', calendarError);
      // Continue with Firestore events only
      events = [];
    }

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

    // Add vacation requests from Firestore if requested
    let firestoreEvents: any[] = [];
    if (includeVacationRequests) {
      try {
        const { db } = getFirebaseAdmin();
        if (db) {
          const snapshot = await db
            .collection('vacationRequests')
            .get();
          
          // Filter approved requests using normalization
          const approvedRequests = snapshot.docs.filter(doc => {
            const data = doc.data();
            const normalizedStatus = normalizeVacationStatus(data.status);
            return normalizedStatus === 'approved';
          });
          
          firestoreEvents = approvedRequests.map(doc => {
            const data = doc.data();
            return {
              id: `firestore_${doc.id}`,
              summary: `${data.userName || 'Unknown'} - ${data.company || 'Unknown'}`,
              description: `Vacation Request\nName: ${data.userName || 'Unknown'}\nCompany: ${data.company || 'Unknown'}\nType: ${data.type || 'Full day'}\nReason: ${data.reason || 'N/A'}`,
              start: data.startDate,
              end: data.endDate,
              colorId: '2', // Green for approved vacation
              company: data.company || 'Unknown',
              userName: data.userName || 'Unknown',
              source: 'firestore',
              calendarEventId: data.calendarEventId || data.googleCalendarEventId
            };
          });
          console.log(`✅ Added ${firestoreEvents.length} Firestore vacation events`);
        }
      } catch (error) {
        console.error('[CALENDAR_API] firestore_error', { error: error instanceof Error ? error.message : String(error) });
      }
    }

    const allEvents = [...vacationEvents, ...firestoreEvents];

    return NextResponse.json({
      success: true,
      events: allEvents,
      totalEvents: events.length,
      vacationEvents: vacationEvents.length,
      firestoreEvents: firestoreEvents.length,
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


