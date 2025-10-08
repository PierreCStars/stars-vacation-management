// src/lib/vacations.ts
import type { Timestamp } from "firebase/firestore";

export type HalfDayType = "morning" | "afternoon" | null;

export interface VacationRequest {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string;   // "YYYY-MM-DD"
  reason?: string;
  company?: string;
  type?: string;
  isHalfDay?: boolean;
  halfDayType?: HalfDayType;
  status?: "pending" | "approved" | "denied" | "cancelled" | string;
  durationDays?: number;
  // Optional server timestamps if present
  startTs?: any;
  endTs?: any;
  createdAt?: any;
  updatedAt?: any;
}

export function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function normalizeDateValue(v: unknown): string | null {
  if (!v) return null;
  // Firestore Timestamp
  const maybeTs = v as Timestamp & { seconds?: number; toDate?: () => Date };
  if (typeof maybeTs?.toDate === "function") return toISODate(maybeTs.toDate());
  // ISO string or "YYYY-MM-DD"
  if (typeof v === "string") {
    // If already "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    const asDate = new Date(v);
    if (!isNaN(asDate.getTime())) return toISODate(asDate);
  }
  // Number (ms)
  if (typeof v === "number") return toISODate(new Date(v));
  return null;
}

export function normalizeRequest(raw: any, id: string): VacationRequest {
  const startDate = normalizeDateValue(raw.startDate) || normalizeDateValue(raw.startTs) || "";
  const endDate   = normalizeDateValue(raw.endDate)   || normalizeDateValue(raw.endTs)   || startDate || "";
  return {
    id,
    userId: raw.userId,
    userName: raw.userName,
    userEmail: raw.userEmail,
    startDate,
    endDate,
    reason: raw.reason,
    company: raw.company,
    type: raw.type,
    isHalfDay: !!raw.isHalfDay,
    halfDayType: (raw.halfDayType ?? null) as HalfDayType,
    status: raw.status ?? "pending",
    durationDays: raw.durationDays,
    startTs: raw.startTs,
    endTs: raw.endTs,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Safe filter utility to avoid runtime errors */
export function safeFilter<T>(list: unknown, predicate: (v: T) => boolean): T[] {
  return Array.isArray(list) ? (list as T[]).filter(predicate) : [];
}
