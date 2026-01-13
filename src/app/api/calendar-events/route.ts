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
import { getAllExternalEvents } from '@/lib/db/calendar-sync.store';

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
    // Use environment variable if available, otherwise fallback to hardcoded ID
    const companyEventsCalendarId = process.env.GOOGLE_CALENDAR_SOURCE_ID || 
      'c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com';
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
    
    // Try fetching from public iCal feed first (for public calendars)
    let icalEventsFetched = false;
    try {
      // Convert calendar ID to iCal feed URL format
      // Format: https://calendar.google.com/calendar/ical/{calendarId}/public/basic.ics
      const encodedCalendarId = encodeURIComponent(companyEventsCalendarId);
      const icalUrl = `https://calendar.google.com/calendar/ical/${encodedCalendarId}/public/basic.ics`;
      
      console.log(`[CALENDAR_API] Attempting to fetch from public iCal feed: ${icalUrl}`);
      const icalResponse = await fetch(icalUrl, {
        headers: {
          'User-Agent': 'Stars Vacation Management/2.0',
        },
      });
      
      if (icalResponse.ok) {
        const icalData = await icalResponse.text();
        // Dynamic import to avoid BigInt polyfill issues during Next.js build
        // This prevents Next.js from trying to bundle node-ical during build phase
        // node-ical uses CommonJS, so we need to handle the default export
        const icalModule = await import('node-ical');
        const ical = (icalModule.default || icalModule) as typeof import('node-ical');
        const parsedEvents = ical.parseICS(icalData);
        
        // Convert iCal events to Google Calendar API format
        const convertedEvents = Object.values(parsedEvents)
          .filter((item: any) => item.type === 'VEVENT')
          .map((item: any) => {
            // Handle iCal date format (can be Date object or string)
            let eventStart: Date | null = null;
            let eventEnd: Date | null = null;
            
            try {
              if (item.start) {
                eventStart = item.start instanceof Date ? item.start : new Date(item.start);
                // Validate date
                if (!eventStart || isNaN(eventStart.getTime())) {
                  console.warn(`[CALENDAR_API] Invalid start date for event: ${item.summary || item.uid}`);
                  return null;
                }
              }
              if (item.end) {
                eventEnd = item.end instanceof Date ? item.end : new Date(item.end);
                // Validate date
                if (!eventEnd || isNaN(eventEnd.getTime())) {
                  console.warn(`[CALENDAR_API] Invalid end date for event: ${item.summary || item.uid}`);
                  return null;
                }
              }
              
              // Skip events without valid dates
              if (!eventStart || !eventEnd) {
                console.warn(`[CALENDAR_API] Event missing dates: ${item.summary || item.uid}`);
                return null;
              }
              
              // Filter events within the requested time range
              // Use overlap check: event overlaps if it starts before timeMax and ends after timeMin
              if (eventStart >= endDate || eventEnd <= startDate) {
                return null; // Event is outside the requested range
              }
            } catch (dateError) {
              console.warn(`[CALENDAR_API] Error parsing dates for event ${item.summary || item.uid}:`, dateError);
              return null;
            }
            
            // At this point, eventStart and eventEnd are guaranteed to be non-null
            // (we return null earlier if they're missing or invalid)
            const eventStartDate = eventStart!;
            const eventEndDate = eventEnd!;
            
            // Determine if it's an all-day event
            // iCal all-day events have dates without time components
            // Check if both start and end are at midnight (00:00:00)
            const isAllDay = (
              (eventStartDate.getHours() === 0 && eventStartDate.getMinutes() === 0 && eventStartDate.getSeconds() === 0) &&
              (eventEndDate.getHours() === 0 && eventEndDate.getMinutes() === 0 && eventEndDate.getSeconds() === 0) &&
              // Also check if the duration is a whole number of days
              (eventEndDate.getTime() - eventStartDate.getTime()) % (24 * 60 * 60 * 1000) === 0
            ) || (
              // Fallback: check if item.start is a string in YYYYMMDD format
              typeof item.start === 'string' && item.start.length === 8 && !item.start.includes('T')
            );
            
            // Format dates for Google Calendar API compatibility
            let start: any = {};
            let end: any = {};
            
            if (isAllDay) {
              // All-day event - format as YYYY-MM-DD
              const startDateStr = eventStartDate.toISOString().split('T')[0];
              // For all-day events, iCal uses exclusive end dates, convert to inclusive
              let endDateStr = eventEndDate.toISOString().split('T')[0];
              if (endDateStr && endDateStr !== startDateStr) {
                // Subtract one day from exclusive end date to get inclusive end date
                const endDateObj = new Date(endDateStr + 'T00:00:00');
                endDateObj.setDate(endDateObj.getDate() - 1);
                endDateStr = endDateObj.toISOString().split('T')[0];
              }
              start = { date: startDateStr };
              end = { date: endDateStr || startDateStr };
            } else {
              // Timed event
              start = { dateTime: eventStartDate.toISOString() };
              end = { dateTime: eventEndDate.toISOString() };
            }
            
            return {
              id: item.uid || `ical_${Date.now()}_${Math.random()}`,
              summary: item.summary || 'Untitled Event',
              description: item.description || '',
              location: item.location || '',
              start,
              end,
              htmlLink: item.url || '',
              status: item.status || 'confirmed',
              iCalUID: item.uid,
            };
          })
          .filter((event: any) => event !== null);
        
        if (convertedEvents.length > 0) {
          console.log(`✅ Found ${convertedEvents.length} events from public iCal feed`);
          events.push(...convertedEvents);
          icalEventsFetched = true;
        }
      } else {
        console.log(`[CALENDAR_API] iCal feed returned status ${icalResponse.status}, falling back to API`);
      }
    } catch (icalError) {
      console.log('[CALENDAR_API] Failed to fetch from iCal feed, falling back to API:', icalError instanceof Error ? icalError.message : String(icalError));
    }
    
    // Fetch from company events calendar using API (fallback or if iCal didn't work)
    if (!icalEventsFetched) {
      try {
        const response = await calendar.events.list({
          calendarId: companyEventsCalendarId,
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        });

        const companyEvents = response.data.items || [];
        console.log(`✅ Found ${companyEvents.length} company calendar events from ${companyEventsCalendarId}`);
        events.push(...companyEvents);
      } catch (calendarError: any) {
        const errorDetails = {
          message: calendarError instanceof Error ? calendarError.message : String(calendarError),
          code: calendarError?.code,
          status: calendarError?.response?.status,
          statusText: calendarError?.response?.statusText,
          calendarId: companyEventsCalendarId,
          serviceAccount: loadGoogleCreds().client_email
        };
        console.error('[CALENDAR_API] Failed to fetch from company events calendar:', errorDetails);
        
        // Log specific error types for easier debugging
        if (errorDetails.status === 403) {
          console.error('[CALENDAR_API] Permission denied - Service account may not have read access to calendar');
        } else if (errorDetails.status === 404) {
          console.error('[CALENDAR_API] Calendar not found - Verify calendar ID is correct');
        }
      }
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

        // Normalize all-day events: convert exclusive end dates to inclusive
        const isAllDay = !!(event.start?.date && !event.start?.dateTime);
        const startDate = event.start?.date || event.start?.dateTime?.slice(0, 10) || '';
        let endDate = event.end?.date || event.end?.dateTime?.slice(0, 10) || '';
        
        // For all-day events, Google Calendar uses exclusive end dates
        // Convert to inclusive for our app
        if (isAllDay && endDate && endDate !== startDate) {
          // Subtract one day from exclusive end date to get inclusive end date
          const endDateObj = new Date(endDate + 'T00:00:00');
          endDateObj.setDate(endDateObj.getDate() - 1);
          const year = endDateObj.getFullYear();
          const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
          const day = String(endDateObj.getDate()).padStart(2, '0');
          endDate = `${year}-${month}-${day}`;
        } else if (isAllDay && (!endDate || endDate === startDate)) {
          // Single-day event: end date should equal start date
          endDate = startDate;
        }

        return {
          id: event.id,
          title: event.summary || 'Untitled Event',
          startDate,
          endDate,
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

    // Add imported external events from Firestore (synced via /api/sync/import-remote)
    let externalEvents: any[] = [];
    try {
      const importedEvents = await getAllExternalEvents();
      
      // Filter events within the requested time range
      const timeMinDate = startDate;
      const timeMaxDate = endDate;
      
      externalEvents = importedEvents
        .filter(event => {
          // Filter out cancelled events
          if (event.status === 'cancelled') return false;
          
          try {
            // Check if event overlaps with requested time range
            const eventStart = new Date(event.startISO);
            const eventEnd = new Date(event.endISO);
            
            // Validate dates
            if (isNaN(eventStart.getTime()) || isNaN(eventEnd.getTime())) {
              console.warn(`[CALENDAR_API] External event has invalid dates: ${event.title}`);
              return false;
            }
            
            // Event overlaps if it starts before timeMax and ends after timeMin
            return eventStart < timeMaxDate && eventEnd > timeMinDate;
          } catch (error) {
            console.warn(`[CALENDAR_API] Error processing external event ${event.title}:`, error);
            return false;
          }
        })
        .map(event => {
          // Format dates - extract date part (YYYY-MM-DD) from ISO string
          let startDate = event.startISO.split('T')[0];
          let endDate = event.endISO.split('T')[0];
          
          // For all-day events, Google Calendar uses exclusive end dates
          // Convert to inclusive for our app (same as we do for direct Google Calendar events)
          if (event.allDay && endDate && endDate !== startDate) {
            // Subtract one day from exclusive end date to get inclusive end date
            const endDateObj = new Date(endDate + 'T00:00:00');
            endDateObj.setDate(endDateObj.getDate() - 1);
            const year = endDateObj.getFullYear();
            const month = String(endDateObj.getMonth() + 1).padStart(2, '0');
            const day = String(endDateObj.getDate()).padStart(2, '0');
            endDate = `${year}-${month}-${day}`;
          } else if (event.allDay && (!endDate || endDate === startDate)) {
            // Single-day event: end date should equal start date
            endDate = startDate;
          }
          
          return {
            id: `external_${event.externalEventId}`,
            title: event.title,
            startDate,
            endDate,
            location: '',
            summary: event.title,
            description: `Imported from Google Calendar (${event.source})`,
            colorId: '8', // Gray color for external events
            company: 'Company Event',
            userName: 'External Event',
            htmlLink: '',
            source: 'external_import',
            iCalUID: event.iCalUID,
            allDay: event.allDay,
          };
        });
      
      console.log(`✅ Added ${externalEvents.length} imported external events from Firestore`);
    } catch (error) {
      console.error('[CALENDAR_API] Error fetching external events:', error);
    }

    const allEvents = [...vacationEvents, ...firestoreEvents, ...externalEvents];

    return NextResponse.json({
      success: true,
      events: allEvents,
      totalEvents: events.length,
      vacationEvents: vacationEvents.length,
      firestoreEvents: firestoreEvents.length,
      externalEvents: externalEvents.length,
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


