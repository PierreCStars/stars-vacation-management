import { google } from 'googleapis';

export interface CalendarConflict {
  calendarId: string;
  eventId?: string;
  summary: string;
  start: string;
  end: string;
  type: 'busy' | 'outOfOffice' | 'allDay' | 'event';
  description?: string;
}

export interface FreeBusyRequest {
  requesterUserId: string;
  calendarIds?: string[];
  start: string;
  end: string;
}

export interface FreeBusyResponse {
  conflicts: CalendarConflict[];
  totalConflicts: number;
  hasConflicts: boolean;
}

/**
 * Get OAuth client for a specific user using their stored tokens
 */
export async function getOAuthClientForUser(userId: string) {
  // For now, we'll use the service account approach
  // In a full implementation, you'd fetch user tokens from NextAuth Account table
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not configured");
  }

  let credentials;
  if (raw.trim().startsWith("{")) {
    credentials = JSON.parse(raw);
    credentials.private_key = String(credentials.private_key).replace(/\\n/g, "\n");
  } else {
    throw new Error("Invalid service account key format");
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });

  return auth;
}

/**
 * Get user's primary calendar ID
 */
export async function getPrimaryCalendarId(oauth: any): Promise<string> {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  
  try {
    const response = await calendar.calendarList.get({ calendarId: 'primary' });
    return response.data.id || 'primary';
  } catch (error) {
    console.warn('Could not get primary calendar, using default:', error);
    return 'primary';
  }
}

/**
 * List calendars accessible to the user
 */
export async function listCalendars(oauth: any): Promise<Array<{id: string, summary: string, primary?: boolean}>> {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  
  try {
    const response = await calendar.calendarList.list();
    return (response.data.items || []).map(cal => ({
      id: cal.id!,
      summary: cal.summary || 'Unknown Calendar',
      primary: cal.primary || false
    }));
  } catch (error) {
    console.error('Error listing calendars:', error);
    return [];
  }
}

/**
 * Check free/busy status for multiple calendars
 */
export async function freeBusy(
  oauth: any, 
  calendarIds: string[], 
  timeMin: string, 
  timeMax: string
): Promise<CalendarConflict[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  
  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: calendarIds.map(id => ({ id })),
        timeZone: 'Europe/Monaco'
      }
    });

    const conflicts: CalendarConflict[] = [];
    
    // Process freebusy results
    for (const [calendarId, calendarData] of Object.entries(response.data.calendars || {})) {
      if (calendarData.busy) {
        for (const busySlot of calendarData.busy) {
          conflicts.push({
            calendarId,
            start: busySlot.start!,
            end: busySlot.end!,
            summary: 'Busy',
            type: 'busy'
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    console.error('Error checking free/busy:', error);
    throw error;
  }
}

/**
 * List events for a specific calendar in a time range
 */
export async function listEvents(
  oauth: any, 
  calendarId: string, 
  timeMin: string, 
  timeMax: string
): Promise<CalendarConflict[]> {
  const calendar = google.calendar({ version: 'v3', auth: oauth });
  
  try {
    const response = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 100
    });

    const conflicts: CalendarConflict[] = [];
    
    for (const event of response.data.items || []) {
      // Skip transparent events (like birthdays)
      if (event.transparency === 'transparent') continue;
      
      // Determine event type
      let type: CalendarConflict['type'] = 'event';
      if (event.eventType === 'outOfOffice') {
        type = 'outOfOffice';
      } else if (event.start?.date && !event.start.dateTime) {
        type = 'allDay';
      }

      conflicts.push({
        calendarId,
        eventId: event.id!,
        summary: event.summary || 'No Title',
        start: event.start?.dateTime || event.start?.date!,
        end: event.end?.dateTime || event.end?.date!,
        type,
        description: event.description || undefined
      });
    }

    return conflicts;
  } catch (error) {
    console.error('Error listing events:', error);
    throw error;
  }
}

/**
 * Main function to detect calendar conflicts for vacation requests
 */
export async function detectCalendarConflicts(request: FreeBusyRequest): Promise<FreeBusyResponse> {
  try {
    const oauth = await getOAuthClientForUser(request.requesterUserId);
    
    // If no specific calendars provided, use primary calendar
    let calendarIds = request.calendarIds;
    if (!calendarIds || calendarIds.length === 0) {
      const primaryId = await getPrimaryCalendarId(oauth);
      calendarIds = [primaryId];
    }

    // Check free/busy status
    const freeBusyConflicts = await freeBusy(oauth, calendarIds, request.start, request.end);
    
    // Get detailed event information
    const eventConflicts: CalendarConflict[] = [];
    for (const calendarId of calendarIds) {
      const events = await listEvents(oauth, calendarId, request.start, request.end);
      eventConflicts.push(...events);
    }

    // Combine and deduplicate conflicts
    const allConflicts = [...freeBusyConflicts, ...eventConflicts];
    const uniqueConflicts = allConflicts.filter((conflict, index, self) => 
      index === self.findIndex(c => 
        c.calendarId === conflict.calendarId && 
        c.start === conflict.start && 
        c.end === conflict.end
      )
    );

    return {
      conflicts: uniqueConflicts,
      totalConflicts: uniqueConflicts.length,
      hasConflicts: uniqueConflicts.length > 0
    };
  } catch (error) {
    console.error('Error detecting calendar conflicts:', error);
    throw error;
  }
}
