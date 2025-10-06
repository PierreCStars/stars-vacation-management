/**
 * Centralized calendar sync service for vacation requests
 * Handles Google Calendar event creation, updates, and deletion with idempotency
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { addVacationToCalendar, deleteVacationFromCalendar, CAL_TARGET } from '@/lib/google-calendar';
import { revalidateTag, revalidatePath } from 'next/cache';

export interface CalendarEventData {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  type: string;
  company: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Ensure a calendar event exists for the given vacation request
 * Creates event if it doesn't exist, updates if it does
 */
export async function ensureEventForRequest(
  db: FirebaseFirestore.Firestore,
  requestDoc: CalendarEventData
): Promise<CalendarSyncResult> {
  try {
    console.log('[CALENDAR] ensure_event start', { 
      id: requestDoc.id, 
      status: requestDoc.status,
      userName: requestDoc.userName,
      startDate: requestDoc.startDate,
      endDate: requestDoc.endDate
    });

    // Only create/update events for approved requests
    if (requestDoc.status !== 'approved') {
      console.log('[CALENDAR] ensure_event skip', { id: requestDoc.id, status: requestDoc.status });
      return { success: true };
    }

    // Check if we already have a calendar event ID
    const docRef = db.collection('vacationRequests').doc(requestDoc.id);
    const doc = await docRef.get();
    const existingData = doc.data();
    const existingEventId = existingData?.calendarEventId;

    if (existingEventId) {
      console.log('[CALENDAR] ensure_event exists', { id: requestDoc.id, eventId: existingEventId });
      return { success: true, eventId: existingEventId };
    }

    // Create new calendar event
    const vacationEvent = {
      userName: requestDoc.userName,
      startDate: requestDoc.startDate,
      endDate: requestDoc.endDate,
      type: requestDoc.type,
      company: requestDoc.company,
      reason: requestDoc.reason
    };

    const eventId = await addVacationToCalendar(vacationEvent);
    console.log('[CALENDAR] ensure_event created', { id: requestDoc.id, eventId });

    // Store the event ID in Firestore for idempotency
    await docRef.update({
      calendarEventId: eventId,
      calendarSyncedAt: new Date().toISOString()
    });

    console.log('[CALENDAR] ensure_event stored', { id: requestDoc.id, eventId });

    return { success: true, eventId: eventId || undefined };
  } catch (error) {
    console.error('[CALENDAR] ensure_event fail', { 
      id: requestDoc.id, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Delete a calendar event for the given vacation request
 * Removes event from Google Calendar and clears the event ID from Firestore
 */
export async function deleteEventForRequest(
  db: FirebaseFirestore.Firestore,
  requestDoc: CalendarEventData
): Promise<CalendarSyncResult> {
  try {
    console.log('[CALENDAR] delete_event start', { 
      id: requestDoc.id, 
      status: requestDoc.status 
    });

    // Get the existing calendar event ID
    const docRef = db.collection('vacationRequests').doc(requestDoc.id);
    const doc = await docRef.get();
    const existingData = doc.data();
    const existingEventId = existingData?.calendarEventId;

    if (!existingEventId) {
      console.log('[CALENDAR] delete_event skip', { id: requestDoc.id, reason: 'no_event_id' });
      return { success: true };
    }

    // Delete from Google Calendar
    await deleteVacationFromCalendar(existingEventId);
    console.log('[CALENDAR] delete_event removed', { id: requestDoc.id, eventId: existingEventId });

    // Clear the event ID from Firestore
    await docRef.update({
      calendarEventId: null,
      calendarSyncedAt: new Date().toISOString()
    });

    console.log('[CALENDAR] delete_event cleared', { id: requestDoc.id });

    return { success: true };
  } catch (error) {
    console.error('[CALENDAR] delete_event fail', { 
      id: requestDoc.id, 
      error: error instanceof Error ? error.message : String(error) 
    });
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Refresh cache tags and paths after calendar operations
 */
export async function refreshCacheTags(): Promise<void> {
  try {
    console.log('[CACHE] revalidate calendar:all');
    await revalidateTag('calendar:all');
    await revalidatePath('/en/admin/vacation-requests');
    await revalidatePath('/en/dashboard');
    console.log('[CACHE] revalidate success');
  } catch (error) {
    console.error('[CACHE] revalidate fail', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    throw error;
  }
}

/**
 * Sync calendar event based on request status
 * Creates event for approved, deletes for rejected/pending
 */
export async function syncEventForRequest(
  requestDoc: CalendarEventData
): Promise<CalendarSyncResult> {
  const { db, error } = getFirebaseAdmin();
  if (!db || error) {
    console.error('[CALENDAR] sync_event fail', { 
      id: requestDoc.id, 
      error: 'Firebase Admin not available' 
    });
    return { 
      success: false, 
      error: 'Firebase Admin not available' 
    };
  }

  if (requestDoc.status === 'approved') {
    return await ensureEventForRequest(db, requestDoc);
  } else {
    return await deleteEventForRequest(db, requestDoc);
  }
}
