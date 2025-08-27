export type ExternalEvent = {
  externalEventId: string;   // Google event.id
  iCalUID?: string | null;
  title: string;
  startISO: string;
  endISO: string;
  allDay: boolean;
  source: "google_calendar_b";
  status?: "confirmed" | "cancelled" | "tentative";
  updatedAt: string; // ISO from Google event.updated
};

export type SyncState = {
  id: "google_calendar_b";
  syncToken?: string | null;
  lastSyncAt?: string | null;
  lastResult?: "ok" | "partial" | "error";
  lastError?: string | null;
  totalImported?: number;
};

export type SyncLog = {
  id: string;              // uuid
  startedAt: string;
  finishedAt?: string;
  status: "running" | "ok" | "error";
  summary?: string;
  itemsInserted?: number;
  itemsUpdated?: number;
  itemsDeleted?: number;
  error?: string | null;
};

export type VacationHalf = "morning" | "afternoon" | null;

export type UpsertVacEventInput = {
  externalId: string;      // stable id in your DB for the vacation request
  title: string;           // e.g., "Vacation — Pierre Corbucci"
  description?: string;
  startDate: string;       // "YYYY-MM-DD"
  endDate: string;         // "YYYY-MM-DD" (inclusive for full day)
  isHalfDay?: boolean;
  halfDayType?: "morning" | "afternoon" | null;
  userEmail?: string;
};
