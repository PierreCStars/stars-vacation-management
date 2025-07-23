import { google } from 'googleapis';

// Initialize Google Calendar API
const auth = new google.auth.GoogleAuth({
  credentials: (() => {
    try {
      const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
      if (!key) {
        console.warn('⚠️ GOOGLE_SERVICE_ACCOUNT_KEY not set, using empty credentials');
        return {};
      }
      return JSON.parse(key);
    } catch (error) {
      console.error('❌ Error parsing GOOGLE_SERVICE_ACCOUNT_KEY:', error);
      return {};
    }
  })(),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendar = google.calendar({ version: 'v3', auth });

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
  // Define a color mapping for companies based on the vacation request form
  // Google Calendar color IDs: 1-11 (different colors)
  const companyColors: { [key: string]: string } = {
    'STARS_MC': '1',           // Blue (default for Stars MC)
    'STARS_YACHTING': '2',     // Green (for Stars Yachting)
    'STARS_REAL_ESTATE': '3',  // Red (for Stars Real Estate)
    'LE_PNEU': '4',            // Orange (for Le Pneu)
    'MIDI_PNEU': '5',          // Yellow (for Midi Pneu)
    'STARS_AVIATION': '6',     // Purple (for Stars Aviation)
  };

  // Return the color for the company, or a default color if not found
  return companyColors[company] || '1'; // Default to blue if company not in list
}

// Helper function to get all available company colors
export function getCompanyColors(): { [key: string]: { id: string; name: string } } {
  return {
    'STARS_MC': { id: '1', name: 'Blue' },
    'STARS_YACHTING': { id: '2', name: 'Green' },
    'STARS_REAL_ESTATE': { id: '3', name: 'Red' },
    'LE_PNEU': { id: '4', name: 'Orange' },
    'MIDI_PNEU': { id: '5', name: 'Yellow' },
    'STARS_AVIATION': { id: '6', name: 'Purple' },
  };
} 