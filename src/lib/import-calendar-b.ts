import { calendarClient, CAL_SOURCE } from "./google-calendar";
import { ExternalEvent } from "./calendar-sync-types";
import {
  getSyncState, upsertSyncState,
  createSyncLog, finishSyncLog,
  upsertExternalEvent, deleteExternalEventById
} from "./db/calendar-sync.store";

/** Conflict & precedence strategy (documented & enforced):
 * - Calendar B is READ-ONLY in app; we never push back to B.
 * - If an event is "cancelled" on B, we mark/delete it in the app's external feed.
 * - If event exists in both B (external) and app-internal with same iCalUID, app-internal "approved vacations" win when rendering (external acts as FYI).
 */

function toExternalEvent(it: any): ExternalEvent {
  const startISO = it.start?.dateTime || (it.start?.date ? `${it.start.date}T00:00:00` : "");
  const endISO   = it.end?.dateTime   || (it.end?.date ? `${it.end.date}T00:00:00`   : "");
  const allDay = !!it.start?.date;
  return {
    externalEventId: it.id!,
    iCalUID: it.iCalUID || null,
    title: it.summary || "(untitled)",
    startISO,
    endISO,
    allDay,
    source: "google_calendar_b",
    status: (it.status || "confirmed") as ExternalEvent["status"],
    updatedAt: it.updated || new Date().toISOString(),
  };
}

export async function importCalendarBIncremental(): Promise<{inserted: number; updated: number; deleted: number; status: "ok" | "partial" | "error"; note?: string;}> {
  const log = await createSyncLog();
  let inserted = 0, updated = 0, deleted = 0;
  let status: "ok" | "partial" | "error" = "ok";
  let note = "";

  try {
    const cal = calendarClient();
    const state = (await getSyncState()) || { id: "google_calendar_b" };
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;
    let usingSyncToken = !!state.syncToken;

    do {
      let resp;
      try {
        if (usingSyncToken) {
          resp = await cal.events.list({
            calendarId: CAL_SOURCE!,
            syncToken: state.syncToken!,
            showDeleted: true,
            singleEvents: true,
            maxResults: 2500,
            pageToken
          });
        } else {
          // First sync window: past 90 days -> next 180 days
          const now = new Date();
          const timeMin = new Date(now.getTime() - 90 * 864e5).toISOString();
          const timeMax = new Date(now.getTime() + 180 * 864e5).toISOString();
          resp = await cal.events.list({
            calendarId: CAL_SOURCE!,
            timeMin,
            timeMax,
            singleEvents: true,
            showDeleted: true,
            maxResults: 2500,
            orderBy: "startTime",
            pageToken
          });
        }
      } catch (err: any) {
        // Handle token expired: 410 GONE
        if (err?.code === 410) {
          usingSyncToken = false;
          state.syncToken = undefined;
          note = "Sync token expired; performed full-window resync.";
          continue; // re-enter loop without token
        }
        throw err;
      }

      const items = resp.data.items || [];
      for (const it of items) {
        if (it.status === "cancelled") {
          // deletion / cancellation
          await deleteExternalEventById(it.id!);
          deleted++;
          continue;
        }
        const ev = toExternalEvent(it);
        // For idempotency, upsert by externalEventId; if exists, count as updated
        // (Store.updatedAt can help detect true update vs no-op)
        await upsertExternalEvent(ev);
        // naive counters for now:
        updated++; // we can refine by checking changed fields
      }

      pageToken = resp.data.nextPageToken || undefined;
      if (resp.data.nextSyncToken) nextSyncToken = resp.data.nextSyncToken;
    } while (pageToken);

    if (nextSyncToken) {
      await upsertSyncState({
        id: "google_calendar_b",
        syncToken: nextSyncToken,
        lastSyncAt: new Date().toISOString(),
        lastResult: status,
        lastError: null,
        totalImported: (state?.totalImported || 0) + inserted + updated,
      });
    }

    await finishSyncLog(log.id, {
      finishedAt: new Date().toISOString(),
      status,
      itemsInserted: inserted,
      itemsUpdated: updated,
      itemsDeleted: deleted,
      summary: note || "Incremental import completed"
    });
    return { inserted: 0, updated, deleted, status, note };
  } catch (e: any) {
    status = "error";
    await finishSyncLog(log.id, {
      finishedAt: new Date().toISOString(),
      status,
      error: e?.message || String(e),
    });
    // keep lastResult + lastError updated
    await upsertSyncState({
      id: "google_calendar_b",
      lastSyncAt: new Date().toISOString(),
      lastResult: status,
      lastError: e?.message || String(e),
    });
    return { inserted: 0, updated, deleted, status, note: e?.message || "error" };
  }
}
