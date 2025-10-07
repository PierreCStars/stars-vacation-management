import type { CalendarGateway, CalendarEventInput } from './types';

const store = new Map<string, { id: string; input: CalendarEventInput }>();

export const FakeCalendarGateway: CalendarGateway = {
  async createEvent(input) {
    const id = `fake-${input.requestId}`;
    store.set(input.requestId, { id, input });
    return { id };
  },
  async deleteEventByRequestId(requestId) {
    store.delete(requestId);
  },
};

export function __getFakeCalendarStore() { return store; }
export function __clearFakeCalendar() { store.clear(); }









