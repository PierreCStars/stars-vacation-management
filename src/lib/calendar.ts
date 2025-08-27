import { WORKDAY } from '@/lib/config';

type EventInput = {
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  isHalfDay: boolean;
  halfDayType: "morning" | "afternoon" | null;
  timezone: string;
  userName: string;
  reason?: string;
};

function toZonedISO(dateISO: string, timeHHMM: string, _tz: string) {
  // Construct ISO with TZ; if using date-fns-tz:
  // return zonedTimeToUtc(`${dateISO}T${timeHHMM}:00`, _tz).toISOString();
  // If your Calendar lib accepts TZ + local time strings, pass as-is along with _tz.
  return `${dateISO}T${timeHHMM}:00`;
}

export async function createVacationCalendarEvent(input: EventInput) {
  const { startDate, endDate, isHalfDay, halfDayType, timezone, userName, reason } = input;

  let startISO: string;
  let endISO: string;
  let eventTitle: string;

  if (isHalfDay && halfDayType === "morning") {
    startISO = toZonedISO(startDate, WORKDAY.START, timezone);
    endISO = toZonedISO(startDate, WORKDAY.MIDDAY_START, timezone);
    eventTitle = `${userName} - Half Day (Morning) - ${reason || 'Vacation'}`;
  } else if (isHalfDay && halfDayType === "afternoon") {
    startISO = toZonedISO(startDate, WORKDAY.MIDDAY_END, timezone);
    endISO = toZonedISO(startDate, WORKDAY.END, timezone);
    eventTitle = `${userName} - Half Day (Afternoon) - ${reason || 'Vacation'}`;
  } else {
    // Full days: all-day or 09:00 → 18:00; choose your existing approach
    startISO = toZonedISO(startDate, WORKDAY.START, timezone);
    endISO = toZonedISO(endDate, WORKDAY.END, timezone);
    eventTitle = `${userName} - Vacation - ${reason || 'Time Off'}`;
  }

  // Create Google Calendar event as before, but with startISO/endISO and timezone
  const calendarEvent = {
    summary: eventTitle,
    description: reason || 'Vacation request',
    start: {
      dateTime: startISO,
      timeZone: timezone,
    },
    end: {
      dateTime: endISO,
      timeZone: timezone,
    },
    // Add other calendar-specific fields as needed
  };

  console.log('📅 Calendar event prepared:', {
    title: eventTitle,
    start: startISO,
    end: endISO,
    timezone,
    isHalfDay,
    halfDayType
  });

  // TODO: Integrate with your existing Google Calendar API
  // await google.calendar().events.insert({
  //   calendarId: 'primary',
  //   requestBody: calendarEvent,
  // });

  return calendarEvent;
}
