import { normalizeVacationStatus } from "@/types/vacation-status";

type FSTimestamp = { toDate: () => Date } | Date | string | null | undefined;

export function tsToIso(ts: FSTimestamp): string | undefined {
  if (!ts) return undefined;
  if (typeof ts === "string") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  }
  if (ts instanceof Date) return ts.toISOString();
  
  // Handle Firestore Timestamp with _seconds/_nanoseconds
  if (ts && typeof ts === 'object' && '_seconds' in ts) {
    const seconds = (ts as any)._seconds;
    const nanoseconds = (ts as any)._nanoseconds || 0;
    const date = new Date(seconds * 1000 + nanoseconds / 1000000);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  }
  
  try {
    // Firestore Timestamp-like with toDate method
    const d = (ts as any).toDate?.();
    if (d instanceof Date && !isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return undefined;
}

// Minimal raw shape; we accept partials and coerce
export type VacationRequestRaw = {
  userId?: string;
  userEmail?: string;
  userName?: string;
  startDate?: FSTimestamp;
  endDate?: FSTimestamp;
  company?: string;
  type?: string;
  status?: string;
  createdAt?: FSTimestamp;
  updatedAt?: FSTimestamp;
  reviewedAt?: FSTimestamp | null;
  reviewedBy?: string | { name?: string; email?: string } | null;
  approvedByName?: string | null;
  approvedByEmail?: string | null;
  googleEventId?: string | null;
};

export function mapFromFirestore(id: string, data: VacationRequestRaw) {
  // Handle both string and object formats for reviewedBy
  let reviewerName = data.approvedByName;
  let reviewerEmail = data.approvedByEmail;
  
  // If new fields are not available, try to extract from reviewedBy
  if (!reviewerName && data.reviewedBy) {
    console.log(`[MAPPER] Extracting reviewer from reviewedBy:`, { id, reviewedBy: data.reviewedBy, type: typeof data.reviewedBy });
    if (typeof data.reviewedBy === 'string') {
      reviewerName = data.reviewedBy;
      console.log(`[MAPPER] Extracted reviewer name from string:`, reviewerName);
    } else if (typeof data.reviewedBy === 'object' && data.reviewedBy?.name) {
      reviewerName = data.reviewedBy.name;
      reviewerEmail = data.reviewedBy.email || reviewerEmail;
      console.log(`[MAPPER] Extracted reviewer name from object:`, reviewerName);
    }
  }

  console.log(`[MAPPER] Final reviewer info:`, { id, reviewerName, reviewerEmail });

  return {
    id,
    userId: data.userId ?? "",
    userEmail: data.userEmail ?? "",
    userName: data.userName ?? "",
    startDate: tsToIso(data.startDate) ?? "",
    endDate: tsToIso(data.endDate) ?? "",
    company: data.company ?? "",
    type: data.type ?? "vacation",
    status: normalizeVacationStatus(data.status ?? "pending"),
    createdAt: tsToIso(data.createdAt) ?? new Date().toISOString(),
    updatedAt: tsToIso(data.updatedAt),
    reviewedAt: tsToIso(data.reviewedAt ?? undefined) ?? null,
    approvedByName: reviewerName ?? null,
    approvedByEmail: reviewerEmail ?? null,
    googleEventId: data.googleEventId ?? undefined,
  } satisfies import("@/types/vacations").VacationRequest;
}
