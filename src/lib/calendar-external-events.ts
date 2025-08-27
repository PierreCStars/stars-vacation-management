import { getAllExternalEvents } from './db/calendar-sync.store';

export interface CalendarExternalEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  source: 'google_calendar_b';
  iCalUID?: string | null;
  status?: string;
}

/**
 * Get all external events formatted for calendar display
 * This function retrieves external events from Calendar B and formats them
 * for use in the app's calendar UI
 */
export async function getExternalEventsForCalendar(): Promise<CalendarExternalEvent[]> {
  try {
    const externalEvents = await getAllExternalEvents();
    
    return externalEvents
      .filter(event => event.status !== 'cancelled') // Filter out cancelled events
      .map(event => ({
        id: `external-${event.externalEventId}`,
        title: event.title,
        start: new Date(event.startISO),
        end: new Date(event.endISO),
        allDay: event.allDay,
        source: 'google_calendar_b' as const,
        iCalUID: event.iCalUID,
        status: event.status,
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  } catch (error) {
    console.error('Error getting external events for calendar:', error);
    return [];
  }
}

/**
 * Check if an external event conflicts with an internal vacation
 * This helps with conflict resolution in the UI
 */
export function hasConflictWithInternal(
  externalEvent: CalendarExternalEvent,
  internalVacations: Array<{ startDate: string; endDate: string; iCalUID?: string }>
): boolean {
  // Check for iCalUID conflicts first (same event)
  if (externalEvent.iCalUID) {
    const hasICalUIDConflict = internalVacations.some(vacation => 
      vacation.iCalUID === externalEvent.iCalUID
    );
    if (hasICalUIDConflict) return true;
  }
  
  // Check for date overlap conflicts
  const externalStart = externalEvent.start;
  const externalEnd = externalEvent.end;
  
  return internalVacations.some(vacation => {
    const internalStart = new Date(vacation.startDate);
    const internalEnd = new Date(vacation.endDate);
    
    // Check if dates overlap
    return externalStart < internalEnd && externalEnd > internalStart;
  });
}

/**
 * Get external events that don't conflict with internal vacations
 * This is useful for showing only non-conflicting external events
 */
export async function getNonConflictingExternalEvents(
  internalVacations: Array<{ startDate: string; endDate: string; iCalUID?: string }>
): Promise<CalendarExternalEvent[]> {
  const allExternal = await getExternalEventsForCalendar();
  
  return allExternal.filter(event => 
    !hasConflictWithInternal(event, internalVacations)
  );
}
