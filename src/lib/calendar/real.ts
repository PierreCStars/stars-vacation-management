import type { CalendarGateway, CalendarEventInput } from './types';
import { google } from 'googleapis';

const CAL_ID = process.env.GOOGLE_CALENDAR_ID!;

async function client() {
  // Use your existing credential flow (service account with domain-wide delegation or OAuth).
  const auth = new google.auth.JWT({
    email: process.env.GCAL_CLIENT_EMAIL!,
    key: (process.env.GCAL_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
    subject: process.env.GSUITE_IMPERSONATE! // optional, for domain-wide delegation
  });
  const calendar = google.calendar({ version: 'v3', auth });
  return calendar;
}

export const RealCalendarGateway: CalendarGateway = {
  async createEvent(input) {
    const calendar = await client();
    const res = await calendar.events.insert({
      calendarId: CAL_ID,
      requestBody: {
        summary: input.summary,
        description: input.description ?? `Vacation request ${input.requestId}`,
        start: { date: undefined, dateTime: input.start, timeZone: 'UTC' },
        end: { date: undefined, dateTime: input.end, timeZone: 'UTC' },
        extendedProperties: { private: { requestId: input.requestId } },
      },
    });
    return { id: res.data.id! };
  },
  async deleteEventByRequestId(requestId) {
    const calendar = await client();
    // Find by extendedProperties.private.requestId
    const res = await calendar.events.list({
      calendarId: CAL_ID,
      privateExtendedProperty: [`requestId=${requestId}`],
      maxResults: 1,
    });
    const ev = res.data.items?.[0];
    if (ev?.id) {
      await calendar.events.delete({ calendarId: CAL_ID, eventId: ev.id });
    }
  },
};
