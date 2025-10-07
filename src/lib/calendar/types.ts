export interface CalendarEventInput {
  requestId: string;
  start: string; // ISO
  end: string;   // ISO
  summary: string;
  description?: string;
}

export interface CalendarGateway {
  createEvent(input: CalendarEventInput): Promise<{ id: string }>;
  deleteEventByRequestId(requestId: string): Promise<void>;
}









