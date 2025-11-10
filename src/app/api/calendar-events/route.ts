export const dynamic = "force-dynamic";
export const revalidate = 86400; // Revalidate every 24 hours (86400 seconds)
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { safeTrim, safeStartsWith } from '@/lib/strings';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationStatus } from '@/types/vacation-status';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';

// Utility function to load and parse Google credentials
function loadGoogleCreds() {
  // Try base64 encoded key first (recommended)
  const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      const obj = JSON.parse(decoded);
      if (!obj.client_email || !obj.private_key) {
        throw new Error("Clé de service Google invalide (champs manquants)");
      }
      obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
      return { client_email: obj.client_email, private_key: obj.private_key };
    } catch (error) {
      console.error('Failed to decode base64 key:', error);
    }
  }

  // Fallback to raw key
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("No Google service account key found");

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
async function getFirestoreEventsOnly(includeVacationRequests: boolean, isAdminUser: boolean = false) {
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
          // Build description - only include reason for admins
          const baseDescription = `Vacation Request\nName: ${data.userName || 'Unknown'}\nCompany: ${data.company || 'Unknown'}\nType: ${data.type || 'Full day'}`;
          const description = isAdminUser && data.reason 
            ? `${baseDescription}\nReason: ${data.reason}`
            : baseDescription;
          
          const event: any = {
            id: `firestore_${doc.id}`,
            summary: `${data.userName || 'Unknown'} - ${data.company || 'Unknown'}`,
            description: description,
            start: data.startDate,
            end: data.endDate,
            colorId: '2', // Green for approved vacation
            company: data.company || 'Unknown',
            userName: data.userName || 'Unknown',
            source: 'firestore',
            calendarEventId: data.calendarEventId || data.googleCalendarEventId
          };
          
          // Only include reason field in event object for admins
          if (isAdminUser && data.reason) {
            event.reason = data.reason;
          }
          
          return event;
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
    
    // Get user session to determine if admin
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email || null;
    const isAdminUser = isAdmin(userEmail);
    
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
    
    // Define calendar IDs - company events calendar and Monaco holidays calendar
    const companyEventsCalendarId = 'c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com';
    const monacoHolidaysCalendarId = 'en-gb.mc#holiday@group.v.calendar.google.com';
    const fallbackCalendarId = process.env.GOOGLE_CALENDAR_ID || companyEventsCalendarId;
    const includeVacationRequests = searchParams.get('includeVacationRequests') !== 'false';

    // Check if Google Calendar credentials are available
    const hasGoogleCreds = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 ||
                          process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 
                          (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
    
    if (!hasGoogleCreds) {
      console.log('[CALENDAR_API] Google Calendar credentials not available, returning Firestore events only');
      return await getFirestoreEventsOnly(includeVacationRequests, isAdminUser);
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
      return await getFirestoreEventsOnly(includeVacationRequests, isAdminUser);
    }

    // Set default time range if not provided - fetch 12 months of data to show all events
    const now = new Date();
    const startDate = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endDate = timeMax ? new Date(timeMax) : new Date(now.getFullYear(), now.getMonth() + 9, 0);

    console.log('📅 Fetching calendar events...');
    console.log('📅 Time range:', startDate.toISOString(), 'to', endDate.toISOString());

    let events: any[] = [];
    
    // Fetch from company events calendar
    try {
      const response = await calendar.events.list({
        calendarId: companyEventsCalendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const companyEvents = response.data.items || [];
      console.log(`✅ Found ${companyEvents.length} company calendar events`);
      events.push(...companyEvents);
    } catch (calendarError) {
      console.error('[CALENDAR_API] Failed to fetch from company events calendar:', calendarError);
    }
    
    // Also fetch from fallback calendar if it's different
    if (fallbackCalendarId !== companyEventsCalendarId) {
      try {
        const fallbackResponse = await calendar.events.list({
          calendarId: fallbackCalendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        const fallbackEvents = fallbackResponse.data.items || [];
        console.log(`✅ Found ${fallbackEvents.length} fallback calendar events`);
        events.push(...fallbackEvents);
      } catch (fallbackError) {
        console.error('[CALENDAR_API] Failed to fetch from fallback calendar:', fallbackError);
      }
    }
    
    // Also fetch from Monaco holidays calendar
    try {
      const holidaysResponse = await calendar.events.list({
        calendarId: monacoHolidaysCalendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const holidaysEvents = holidaysResponse.data.items || [];
      console.log(`✅ Found ${holidaysEvents.length} Monaco holidays calendar events`);
      events.push(...holidaysEvents);
    } catch (holidaysError) {
      console.error('[CALENDAR_API] Failed to fetch from Monaco holidays calendar:', holidaysError);
    }
    
    console.log(`✅ Total calendar events: ${events.length}`);

    // Format all events (including company events, holidays, etc.)
    const vacationEvents = events
      .filter(event => {
        // Show all events from the calendar
        const summary = event.summary || '';
        const description = event.description || '';
        // Include vacation events and other company events/holidays
        return true; // Show all events from the calendars
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
          title: event.summary || 'Untitled Event',
          startDate: event.start?.date || event.start?.dateTime?.slice(0, 10) || '',
          endDate: event.end?.date || event.end?.dateTime?.slice(0, 10) || '',
          location: event.location || '',
          summary: event.summary,
          description: event.description,
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
            // Build description - only include reason for admins
            const baseDescription = `Vacation Request\nName: ${data.userName || 'Unknown'}\nCompany: ${data.company || 'Unknown'}\nType: ${data.type || 'Full day'}`;
            const description = isAdminUser && data.reason 
              ? `${baseDescription}\nReason: ${data.reason}`
              : baseDescription;
            
            const event: any = {
              id: `firestore_${doc.id}`,
              summary: `${data.userName || 'Unknown'} - ${data.company || 'Unknown'}`,
              description: description,
              start: data.startDate,
              end: data.endDate,
              colorId: '2', // Green for approved vacation
              company: data.company || 'Unknown',
              userName: data.userName || 'Unknown',
              source: 'firestore',
              calendarEventId: data.calendarEventId || data.googleCalendarEventId
            };
            
            // Only include reason field in event object for admins
            if (isAdminUser && data.reason) {
              event.reason = data.reason;
            }
            
            return event;
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


