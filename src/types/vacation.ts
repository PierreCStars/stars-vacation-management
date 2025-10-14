export type HalfDayType = "morning" | "afternoon" | null;

import { VacationStatus } from './vacation-status';

export interface VacationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company?: string;
  type: string;
  status: VacationStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: string | null;  // Allow null from Firestore
  adminComment?: string;
  included?: boolean;
  openDays?: string;
  
  // New ½-day vacation fields
  isHalfDay?: boolean;           // default false
  halfDayType?: HalfDayType;     // "morning" | "afternoon" | null
  durationDays?: number;         // e.g., 1, 2.5, 0.5
  
  // Google Calendar integration
  googleEventId?: string;        // ID of the Google Calendar event
}
