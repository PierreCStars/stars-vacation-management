import { calendarClient, CAL_TARGET, APP_TZ, toRFC3339Local } from "./google-calendar";
import { UpsertVacEventInput } from "./calendar-sync-types";

const WORKDAY = {
  START: "09:00",
  MIDDAY_START: "13:00",
  MIDDAY_END: "14:00",
  END: "18:00",
} as const;

function makeEventTimes(input: UpsertVacEventInput) {
  const { startDate, endDate, isHalfDay, halfDayType } = input;
  if (isHalfDay) {
    if (halfDayType === "morning") {
      return {
        start: { dateTime: toRFC3339Local(startDate, WORKDAY.START), timeZone: APP_TZ },
        end:   { dateTime: toRFC3339Local(startDate, WORKDAY.MIDDAY_START), timeZone: APP_TZ },
      };
    }
    // afternoon default
    return {
      start: { dateTime: toRFC3339Local(startDate, WORKDAY.MIDDAY_END), timeZone: APP_TZ },
      end:   { dateTime: toRFC3339Local(startDate, WORKDAY.END), timeZone: APP_TZ },
    };
  }
  // Full-day: use all-day event (date only) to block whole days
  return {
    start: { date: startDate },
    end: { date: addOneDayISO(endDate) }, // RFC 5545 all-day end is exclusive
  };
}

function addOneDayISO(yyyyMMDD: string) {
  const d = new Date(yyyyMMDD + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0,10);
}

export async function upsertVacationEvent(input: UpsertVacEventInput) {
  const calendar = calendarClient();

  // Use a deterministic iCal UID to enable idempotency across updates
  const iCalUID = `stars-vacation-${input.externalId}@stars.mc`;

  const { start, end } = makeEventTimes(input);

  const event = {
    summary: input.title,
    description: input.description || "",
    start,
    end,
    attendees: input.userEmail ? [{ email: input.userEmail, responseStatus: "accepted" as const }] : undefined,
    transparency: "opaque",
    iCalUID,
    colorId: "1", // Default color - will be enhanced to use company-specific colors
  };

  // Try to find existing by iCalUID
  const list = await calendar.events.list({
    calendarId: CAL_TARGET,
    privateExtendedProperty: undefined,
    maxResults: 1,
    iCalUID,
    showDeleted: false,
    singleEvents: true,
  });

  if (list.data.items && list.data.items.length > 0) {
    const existing = list.data.items[0];
    const eventId = existing.id!;
    const res = await calendar.events.patch({
      calendarId: CAL_TARGET,
      eventId,
      requestBody: event,
      sendUpdates: "none",
    });
    return res.data;
  } else {
    const res = await calendar.events.insert({
      calendarId: CAL_TARGET,
      requestBody: event,
      sendUpdates: "none",
    });
    return res.data;
  }
}

export async function deleteVacationEventByExternalId(externalId: string) {
  const calendar = calendarClient();
  const iCalUID = `stars-vacation-${externalId}@stars.mc`;

  const list = await calendar.events.list({
    calendarId: CAL_TARGET,
    iCalUID,
    maxResults: 1,
    singleEvents: true,
    showDeleted: false,
  });
  if (list.data.items?.[0]?.id) {
    await calendar.events.delete({
      calendarId: CAL_TARGET,
      eventId: list.data.items[0].id!,
      sendUpdates: "none",
    });
  }
}
