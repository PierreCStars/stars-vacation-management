import { google } from 'googleapis';
import { getGoogleCalendarColorId, getCompanyColor } from './company-colors';

// Utility function to load and parse Google credentials
// Updated: Fixed newline handling for Google Calendar integration
// Deployed: Testing environment variable update
type GoogleCreds = {
  client_email: string;
  private_key: string;
};

function loadGoogleCreds(): GoogleCreds {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY manquante");

  // 1) Si c'est du JSON (cas recommandé en .env)
  if (raw.trim().startsWith("{")) {
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

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: (() => {
    try {
      return loadGoogleCreds();
    } catch (error) {
      console.error('❌ Error loading Google credentials:', error);
      return {};
    }
  })(),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

// Export calendar client for use in other modules
export function calendarClient() {
  return calendar;
}

// Calendar IDs from environment variables
export const CAL_TARGET = process.env.GOOGLE_CALENDAR_TARGET_ID || process.env.GOOGLE_CALENDAR_ID || 'primary';
export const CAL_SOURCE = process.env.GOOGLE_CALENDAR_SOURCE_ID;
export const APP_TZ = process.env.APP_TIMEZONE || "Europe/Monaco";

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
    console.log('📅 Adding vacation event to Google Calendar...');
    
    const startDate = new Date(vacationEvent.startDate);
    const endDate = new Date(vacationEvent.endDate);
    
    // Add one day to end date since Google Calendar events are exclusive
    endDate.setDate(endDate.getDate() + 1);
    
    // Convert company enum to display name
    const companyDisplayName = getCompanyDisplayName(vacationEvent.company);
    
    const event = {
      summary: `${vacationEvent.userName} - ${companyDisplayName}`,
      description: `Name: ${vacationEvent.userName}\nCompany: ${companyDisplayName}\nDate Range: ${startDate.toLocaleDateString()} - ${new Date(vacationEvent.endDate).toLocaleDateString()}`,
      start: {
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
        timeZone: 'UTC',
      },
      end: {
        date: endDate.toISOString().split('T')[0], // YYYY-MM-DD format
        timeZone: 'UTC',
      },
      colorId: getColorIdForCompany(vacationEvent.company),
      transparency: 'transparent', // Show as "busy" but transparent
    };

    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    console.log('✅ Vacation event added to Google Calendar:', response.data.id);
    return response.data.id;
    
  } catch (error) {
    console.error('❌ Error adding vacation to Google Calendar:', error);
    throw error;
  }
}

export async function removeVacationFromCalendar(eventId: string) {
  try {
    console.log('📅 Removing vacation event from Google Calendar...');
    
    const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
    
    await calendar.events.delete({
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