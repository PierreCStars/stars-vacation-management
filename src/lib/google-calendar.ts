import { google, calendar_v3 } from 'googleapis';
import { getGoogleCalendarColorId, getCompanyColor } from './company-colors';

// Utility function to load and parse Google credentials
// Updated: Fixed newline handling for Google Calendar integration
// Deployed: Testing environment variable update

/**
 * Canonical service account for Google Calendar operations
 * 
 * This is the preferred service account for calendar sync.
 * The calendar is shared with both:
 * - vacation-db@holiday-461710.iam.gserviceaccount.com (preferred)
 * - stars-vacation-management@appspot.gserviceaccount.com (App Engine default, also has permissions)
 * 
 * We prefer vacation-db@holiday-461710.iam.gserviceaccount.com for consistency.
 */
export const CANONICAL_SERVICE_ACCOUNT = 'vacation-db@holiday-461710.iam.gserviceaccount.com';

/**
 * Alternative service account that also has permissions
 * Used for validation but not required if canonical account is used
 */
export const ALTERNATIVE_SERVICE_ACCOUNT = 'stars-vacation-management@appspot.gserviceaccount.com';

// Legacy export for backward compatibility
export const EXPECTED_SERVICE_ACCOUNT = CANONICAL_SERVICE_ACCOUNT;

type GoogleCreds = {
  client_email: string;
  private_key: string;
};

function loadGoogleCreds(): GoogleCreds {
  let credentials: GoogleCreds | null = null;
  let source = 'unknown';
  
  // Try base64 encoded key first (GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64)
  const base64Key = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64;
  if (base64Key) {
    try {
      const decoded = Buffer.from(base64Key, 'base64').toString('utf-8');
      const obj = JSON.parse(decoded);
      if (!obj.client_email || !obj.private_key) {
        throw new Error("Base64 Google Calendar service account key invalid (missing fields)");
      }
      // Normalize private key newlines
      obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
      credentials = { client_email: obj.client_email, private_key: obj.private_key };
      source = 'GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64';
    } catch (error) {
      console.error('❌ Error decoding base64 Google Calendar key:', error);
      throw new Error("Failed to decode GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64");
    }
  }

  // Fallback to regular key (GOOGLE_SERVICE_ACCOUNT_KEY)
  if (!credentials) {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (!raw) throw new Error("GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY missing");

    // 1) Si c'est du JSON (cas recommandé en .env)
    if (raw.trim().startsWith("{")) {
      const obj = JSON.parse(raw);
      if (!obj.client_email || !obj.private_key) {
        throw new Error("Clé de service Google invalide (champs manquants)");
      }
      // Remettre de vrais retours à la ligne
      obj.private_key = String(obj.private_key).replace(/\\n/g, "\n");
      credentials = { client_email: obj.client_email, private_key: obj.private_key };
      source = 'GOOGLE_SERVICE_ACCOUNT_KEY';
    } else {
      // 2) Si quelqu'un a mis directement le PEM dans la variable
      const pem = raw.includes("\\n") ? raw.replace(/\\n/g, "\n") : raw;
      credentials = { client_email: process.env.GOOGLE_CLIENT_EMAIL!, private_key: pem };
      source = 'GOOGLE_SERVICE_ACCOUNT_KEY + GOOGLE_CLIENT_EMAIL';
    }
  }

  if (!credentials) {
    throw new Error("Failed to load Google Calendar credentials from any source");
  }

  // Validate service account email - both accounts have permissions, but prefer canonical
  const isCanonical = credentials.client_email === CANONICAL_SERVICE_ACCOUNT;
  const isAlternative = credentials.client_email === ALTERNATIVE_SERVICE_ACCOUNT;
  const isValidServiceAccount = isCanonical || isAlternative;
  
  console.log('[CALENDAR] Credentials loaded', {
    source,
    serviceAccountEmail: credentials.client_email,
    canonicalServiceAccount: CANONICAL_SERVICE_ACCOUNT,
    isCanonical: isCanonical ? '✅' : '❌',
    isAlternative: isAlternative ? '✅' : '❌',
    isValidServiceAccount: isValidServiceAccount ? '✅ VALID' : '❌ UNKNOWN',
    note: isCanonical 
      ? 'Using preferred canonical service account' 
      : isAlternative 
        ? 'Using alternative service account (also has permissions)' 
        : `⚠️ Unknown service account "${credentials.client_email}" - may not have calendar permissions`
  });

  if (!isValidServiceAccount) {
    console.warn('[CALENDAR] ⚠️ Unknown service account detected', {
      actual: credentials.client_email,
      canonical: CANONICAL_SERVICE_ACCOUNT,
      alternative: ALTERNATIVE_SERVICE_ACCOUNT,
      message: 'This service account may not have calendar permissions. Calendar sync may fail.',
      recommendation: `Use credentials for ${CANONICAL_SERVICE_ACCOUNT} (preferred) or ${ALTERNATIVE_SERVICE_ACCOUNT}`
    });
  } else if (!isCanonical) {
    console.info('[CALENDAR] Using alternative service account', {
      actual: credentials.client_email,
      canonical: CANONICAL_SERVICE_ACCOUNT,
      note: 'This account has permissions, but consider using the canonical account for consistency'
    });
  }

  return credentials;
}

// Initialize Google Calendar API with proper error handling
let authInstance: InstanceType<typeof google.auth.GoogleAuth> | null = null;
let calendar: calendar_v3.Calendar | null = null;

export function initializeCalendarClient(): { auth: InstanceType<typeof google.auth.GoogleAuth>; calendar: calendar_v3.Calendar } {
  if (authInstance && calendar) {
    return { auth: authInstance, calendar };
  }

  try {
    const credentials = loadGoogleCreds();
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Google Calendar credentials are missing or invalid');
    }

    authInstance = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    calendar = google.calendar({ version: 'v3', auth: authInstance });
    
    // Verify service account (already validated in loadGoogleCreds, but log again)
    const isCanonical = credentials.client_email === CANONICAL_SERVICE_ACCOUNT;
    const isAlternative = credentials.client_email === ALTERNATIVE_SERVICE_ACCOUNT;
    const isValidServiceAccount = isCanonical || isAlternative;
    
    console.log('[CALENDAR] Client initialized successfully', {
      clientEmail: credentials.client_email,
      canonicalServiceAccount: CANONICAL_SERVICE_ACCOUNT,
      isCanonical: isCanonical ? '✅' : '❌',
      isValidServiceAccount: isValidServiceAccount ? '✅' : '❌',
      calendarTarget: CAL_TARGET,
      scopes: ['https://www.googleapis.com/auth/calendar']
    });
    
    if (!isValidServiceAccount) {
      console.error('[CALENDAR] ❌ CRITICAL: Unknown service account!', {
        actual: credentials.client_email,
        canonical: CANONICAL_SERVICE_ACCOUNT,
        alternative: ALTERNATIVE_SERVICE_ACCOUNT,
        calendarId: CAL_TARGET,
        message: `Calendar sync may fail because "${credentials.client_email}" may not have permissions.`,
        fix: `Update GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY in Vercel to use credentials for ${CANONICAL_SERVICE_ACCOUNT}`
      });
    }

    return { auth: authInstance, calendar };
  } catch (error) {
    console.error('❌ Error initializing Google Calendar client:', error);
    throw new Error(`Failed to initialize Google Calendar client: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export calendar client for use in other modules
export function calendarClient() {
  const { calendar: cal } = initializeCalendarClient();
  return cal;
}

// Calendar IDs from environment variables
// Target calendar: c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
// Service account: vacation-db@holiday-461710.iam.gserviceaccount.com
export const CAL_TARGET = process.env.GOOGLE_CALENDAR_TARGET_ID || 
                          process.env.GOOGLE_CALENDAR_ID || 
                          'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';
export const CAL_SOURCE = process.env.GOOGLE_CALENDAR_SOURCE_ID;
export const APP_TZ = process.env.APP_TIMEZONE || "Europe/Monaco";

// EXPECTED_SERVICE_ACCOUNT is defined above

// Log calendar configuration on module load
console.log('[CALENDAR] Configuration loaded', {
  targetCalendarId: CAL_TARGET,
  sourceCalendarId: CAL_SOURCE || 'Not set',
  timezone: APP_TZ,
  expectedServiceAccount: EXPECTED_SERVICE_ACCOUNT,
  envVarSet: {
    GOOGLE_CALENDAR_TARGET_ID: !!process.env.GOOGLE_CALENDAR_TARGET_ID,
    GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64: !!process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64,
    GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY
  },
  version: '2025-01-XX-v3'
});

// Utility function to convert date and time to RFC3339 local format
export function toRFC3339Local(dateISO: string, timeHHMM: string) {
  // Produces a local-time RFC3339 without timezone offset; Calendar uses timeZone field.
  return `${dateISO}T${timeHHMM}:00`;
}

export interface VacationEvent {
  userName: string;
  startDate: string;
  endDate: string;
  type: string;
  company: string;
  reason?: string;
}

export async function addVacationToCalendar(vacationEvent: VacationEvent) {
  try {
    console.log('[CALENDAR] add_event start', { 
      userName: vacationEvent.userName, 
      startDate: vacationEvent.startDate, 
      endDate: vacationEvent.endDate,
      calendarId: CAL_TARGET 
    });

    // Initialize calendar client with error handling
    const { calendar: cal } = initializeCalendarClient();
    
    const startDate = new Date(vacationEvent.startDate);
    const endDate = new Date(vacationEvent.endDate);
    
    // Add one day to end date since Google Calendar all-day events are exclusive
    // For all-day events, end date should be the day after the last day
    const endDateExclusive = new Date(endDate);
    endDateExclusive.setDate(endDateExclusive.getDate() + 1);
    
    // Convert company enum to display name
    const companyDisplayName = getCompanyDisplayName(vacationEvent.company);
    
    // Build event description with app URL if available
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://vacation.stars.mc';
    const description = [
      `Name: ${vacationEvent.userName}`,
      `Company: ${companyDisplayName}`,
      `Type: ${vacationEvent.type || 'Full day'}`,
      `Date Range: ${startDate.toLocaleDateString('en-GB', { timeZone: APP_TZ })} - ${endDate.toLocaleDateString('en-GB', { timeZone: APP_TZ })}`,
      ...(vacationEvent.reason ? [`Reason: ${vacationEvent.reason}`] : []),
      `\nView in app: ${baseUrl}`
    ].join('\n');
    
    const event = {
      summary: `${vacationEvent.userName} - ${companyDisplayName}`,
      description,
      start: {
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format for all-day
      },
      end: {
        date: endDateExclusive.toISOString().split('T')[0], // YYYY-MM-DD format for all-day (exclusive)
      },
      colorId: getColorIdForCompany(vacationEvent.company),
      transparency: 'transparent', // Show as "busy" but transparent
    };

    console.log('[CALENDAR] add_event API call', {
      calendarId: CAL_TARGET,
      eventSummary: event.summary,
      eventStart: event.start.date,
      eventEnd: event.end.date,
      serviceAccount: loadGoogleCreds().client_email
    });

    const response = await cal.events.insert({
      calendarId: CAL_TARGET,
      requestBody: event,
    });

    const createdEventId = response.data.id;
    console.log('[CALENDAR] add_event success', { 
      eventId: createdEventId, 
      calendarId: CAL_TARGET,
      eventLink: response.data.htmlLink,
      serviceAccount: loadGoogleCreds().client_email
    });
    return createdEventId || undefined; // Ensure we return string | undefined, not null
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error && 'code' in error ? { code: (error as any).code } : {};
    
    // Extract HTTP status code if available
    const httpStatus = (error as any)?.response?.status;
    const httpStatusText = (error as any)?.response?.statusText;
    const responseData = (error as any)?.response?.data;
    
    // Get service account email for debugging
    const credentials = loadGoogleCreds();
    
    console.error('[CALENDAR] add_event fail', { 
      error: errorMessage,
      errorDetails,
      httpStatus,
      httpStatusText,
      responseData,
      calendarId: CAL_TARGET,
      serviceAccountEmail: credentials.client_email,
      userName: vacationEvent.userName,
      startDate: vacationEvent.startDate,
      endDate: vacationEvent.endDate,
      eventPayload: {
        summary: `${vacationEvent.userName} - ${getCompanyDisplayName(vacationEvent.company)}`,
        start: vacationEvent.startDate,
        end: vacationEvent.endDate
      }
    });
    
    // Provide more specific error messages
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') || httpStatus === 403) {
      const isCanonical = credentials.client_email === CANONICAL_SERVICE_ACCOUNT;
      const isAlternative = credentials.client_email === ALTERNATIVE_SERVICE_ACCOUNT;
      const isValidServiceAccount = isCanonical || isAlternative;
      
      const accountStatus = isCanonical 
        ? '✅ Using canonical service account' 
        : isAlternative 
          ? '✅ Using alternative service account (has permissions)' 
          : '❌ Unknown service account (may not have permissions)';
      
      const detailedError = `Calendar permission denied. 
Service Account: ${credentials.client_email}
Account Status: ${accountStatus}
Target Calendar: ${CAL_TARGET}
HTTP Status: ${httpStatus || 'N/A'}
Error: ${errorMessage}

Please verify:
1. Service account ${credentials.client_email} has "Make changes to events" permission on calendar ${CAL_TARGET}
2. Calendar ID is correct: c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
3. Permissions have propagated (wait 2-5 minutes after granting)
${!isValidServiceAccount ? `\n4. Consider using ${CANONICAL_SERVICE_ACCOUNT} (preferred) or ${ALTERNATIVE_SERVICE_ACCOUNT} (also has permissions)` : ''}`;
      throw new Error(detailedError);
    }
    if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404') || httpStatus === 404) {
      throw new Error(`Calendar not found: ${CAL_TARGET}. Please verify the calendar ID is correct. HTTP Status: ${httpStatus}`);
    }
    if (errorMessage.includes('credentials') || errorMessage.includes('authentication')) {
      throw new Error(`Calendar authentication failed. Service account: ${credentials.client_email}. Please check GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64 or GOOGLE_SERVICE_ACCOUNT_KEY environment variable.`);
    }
    
    throw error;
  }
}

export async function removeVacationFromCalendar(eventId: string) {
  try {
    console.log('📅 Removing vacation event from Google Calendar...');
    
    const calendarId = CAL_TARGET;
    
    // Initialize calendar client with error handling
    const { calendar: cal } = initializeCalendarClient();
    
    await cal.events.delete({
      calendarId,
      eventId,
    });

    console.log('✅ Vacation event removed from Google Calendar');
    
  } catch (error) {
    console.error('❌ Error removing vacation from Google Calendar:', error);
    throw error;
  }
}

function getCompanyDisplayName(company: string): string {
  // Convert company enum values to user-friendly display names
  const companyDisplayNames: { [key: string]: string } = {
    'STARS_MC': 'Stars MC',
    'STARS_YACHTING': 'Stars Yachting',
    'STARS_REAL_ESTATE': 'Stars Real Estate',
    'LE_PNEU': 'Le Pneu',
    'MIDI_PNEU': 'Midi Pneu',
    'STARS_AVIATION': 'Stars Aviation',
  };

  // Return the display name for the company, or the original value if not found
  return companyDisplayNames[company] || company;
}

function getColorIdForCompany(company: string): string {
  // Use centralized company color configuration
  return getGoogleCalendarColorId(company);
}

// Helper function to get all available company colors
export function getCompanyColors() {
  return getCompanyColor;
} 

function getJwt() {
  // Parse the service account key from environment variable
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON format');
  }

  const { client_email, private_key } = credentials;
  if (!client_email || !private_key) {
    throw new Error('Missing client_email or private_key in service account');
  }

  // Clean up the private key (remove \n escapes)
  const cleanPrivateKey = private_key.replace(/\\n/g, '\n');

  return new google.auth.JWT({
    email: client_email,
    key: cleanPrivateKey,
    scopes: [
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar'
    ],
  });
}

export async function listEventsInRange(calendarId: string, timeMinISO: string, timeMaxISO: string) {
  const auth = getJwt();
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const res = await calendar.events.list({
      calendarId,
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500
    });
    return res.data.items || [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
}

export async function addEventToCalendar(calendarId: string, event: {
  summary: string;
  description?: string;
  start: { date?: string; dateTime?: string };
  end: { date?: string; dateTime?: string };
  location?: string;
}) {
  const auth = getJwt();
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: event
    });
    return res.data;
  } catch (error) {
    console.error('Error adding event to calendar:', error);
    throw error;
  }
}

export async function updateVacationInCalendar(eventId: string, vacationEvent: VacationEvent) {
  try {
    console.log('[CALENDAR] update_event start', { 
      eventId, 
      userName: vacationEvent.userName, 
      startDate: vacationEvent.startDate, 
      endDate: vacationEvent.endDate,
      calendarId: CAL_TARGET 
    });

    // Initialize calendar client with error handling
    const { calendar: cal } = initializeCalendarClient();
    
    const startDate = new Date(vacationEvent.startDate);
    const endDate = new Date(vacationEvent.endDate);
    
    // Add one day to end date since Google Calendar all-day events are exclusive
    const endDateExclusive = new Date(endDate);
    endDateExclusive.setDate(endDateExclusive.getDate() + 1);
    
    // Convert company enum to display name
    const companyDisplayName = getCompanyDisplayName(vacationEvent.company);
    
    // Build event description with app URL if available
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://vacation.stars.mc';
    const description = [
      `Name: ${vacationEvent.userName}`,
      `Company: ${companyDisplayName}`,
      `Type: ${vacationEvent.type || 'Full day'}`,
      `Date Range: ${startDate.toLocaleDateString('en-GB', { timeZone: APP_TZ })} - ${endDate.toLocaleDateString('en-GB', { timeZone: APP_TZ })}`,
      ...(vacationEvent.reason ? [`Reason: ${vacationEvent.reason}`] : []),
      `\nView in app: ${baseUrl}`
    ].join('\n');
    
    const event = {
      summary: `${vacationEvent.userName} - ${companyDisplayName}`,
      description,
      start: {
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format for all-day
      },
      end: {
        date: endDateExclusive.toISOString().split('T')[0], // YYYY-MM-DD format for all-day (exclusive)
      },
      colorId: getColorIdForCompany(vacationEvent.company),
      transparency: 'transparent',
    };

    const response = await cal.events.update({
      calendarId: CAL_TARGET,
      eventId: eventId,
      requestBody: event,
    });

    const updatedEventId = response.data.id || eventId; // Fallback to original eventId if response doesn't have id
    console.log('[CALENDAR] update_event success', { 
      eventId: updatedEventId, 
      calendarId: CAL_TARGET 
    });
    return updatedEventId || undefined; // Ensure we return string | undefined, not null
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const httpStatus = (error as any)?.response?.status;
    const responseData = (error as any)?.response?.data;
    const credentials = loadGoogleCreds();
    
    console.error('[CALENDAR] update_event fail', { 
      eventId,
      error: errorMessage,
      httpStatus,
      responseData,
      calendarId: CAL_TARGET,
      serviceAccountEmail: credentials.client_email
    });
    
    // Provide more specific error messages
    if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403') || httpStatus === 403) {
      const isCanonical = credentials.client_email === CANONICAL_SERVICE_ACCOUNT;
      const isAlternative = credentials.client_email === ALTERNATIVE_SERVICE_ACCOUNT;
      const isValidServiceAccount = isCanonical || isAlternative;
      
      const accountStatus = isCanonical 
        ? '✅ Using canonical service account' 
        : isAlternative 
          ? '✅ Using alternative service account (has permissions)' 
          : '❌ Unknown service account (may not have permissions)';
      
      const detailedError = `Calendar permission denied. 
Service Account: ${credentials.client_email}
Account Status: ${accountStatus}
Target Calendar: ${CAL_TARGET}
Event ID: ${eventId}
HTTP Status: ${httpStatus || 'N/A'}
Error: ${errorMessage}

Please verify:
1. Service account ${credentials.client_email} has "Make changes to events" permission on calendar ${CAL_TARGET}
2. Calendar ID is correct: c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
3. Permissions have propagated (wait 2-5 minutes after granting)
${!isValidServiceAccount ? `\n4. Consider using ${CANONICAL_SERVICE_ACCOUNT} (preferred) or ${ALTERNATIVE_SERVICE_ACCOUNT} (also has permissions)` : ''}`;
      throw new Error(detailedError);
    }
    if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404') || httpStatus === 404) {
      throw new Error(`Calendar event not found: ${eventId} in calendar: ${CAL_TARGET}`);
    }
    
    throw error;
  }
}

export async function deleteVacationFromCalendar(eventId: string) {
  try {
    console.log('[CALENDAR] delete_event', { eventId, calendarId: CAL_TARGET });
    
    // Initialize calendar client with error handling
    const { calendar: cal } = initializeCalendarClient();
    
    await cal.events.delete({
      calendarId: CAL_TARGET,
      eventId: eventId
    });
    console.log('[CALENDAR] delete_event success', { eventId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const httpStatus = (error as any)?.response?.status;
    const responseData = (error as any)?.response?.data;
    const credentials = loadGoogleCreds();
    
    console.error('[CALENDAR] delete_event fail', { 
      eventId, 
      error: errorMessage,
      httpStatus,
      responseData,
      calendarId: CAL_TARGET,
      serviceAccountEmail: credentials.client_email
    });
    
    // Don't throw error if event is already deleted (404)
    if (errorMessage.includes('NOT_FOUND') || errorMessage.includes('404') || httpStatus === 404) {
      console.log('[CALENDAR] delete_event skip - event already deleted', { eventId });
      return;
    }
    
    throw error;
  }
}

export async function removeEventFromCalendar(calendarId: string, eventId: string) {
  const auth = getJwt();
  const calendar = google.calendar({ version: 'v3', auth });
  
  try {
    await calendar.events.delete({
      calendarId,
      eventId
    });
    return true;
  } catch (error) {
    console.error('Error removing event from calendar:', error);
    throw error;
  }
} 