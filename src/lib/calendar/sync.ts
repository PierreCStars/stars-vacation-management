/**
 * Centralized calendar sync service for vacation requests
 * Handles Google Calendar event creation, updates, and deletion with idempotency
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { addVacationToCalendar, updateVacationInCalendar, deleteVacationFromCalendar, CAL_TARGET, calendarClient } from '@/lib/google-calendar';
import { revalidateTag, revalidatePath } from 'next/cache';
import { normalizeVacationStatus } from '@/types/vacation-status';

export interface CalendarEventData {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  type: string;
  company: string;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
}

export interface CalendarSyncResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Ensure a calendar event exists for the given vacation request
 * Creates event if it doesn't exist, updates if dates changed
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
    const normalizedStatus = normalizeVacationStatus(requestDoc.status);
    if (normalizedStatus !== 'approved') {
      console.log('[CALENDAR] ensure_event skip', { id: requestDoc.id, status: requestDoc.status, normalizedStatus });
      return { success: true };
    }

    // Check if we already have a calendar event ID
    const docRef = db.collection('vacationRequests').doc(requestDoc.id);
    const doc = await docRef.get();
    const existingData = doc.data();
    // Check all possible event ID fields for backward compatibility
    const existingEventId = existingData?.calendarEventId || 
                            existingData?.googleCalendarEventId || 
                            existingData?.googleEventId;
    const existingStartDate = existingData?.startDate;
    const existingEndDate = existingData?.endDate;

    // Prepare vacation event data
    const vacationEvent = {
      userName: requestDoc.userName,
      startDate: requestDoc.startDate,
      endDate: requestDoc.endDate,
      type: requestDoc.type,
      company: requestDoc.company,
      reason: requestDoc.reason
    };

    // Check if dates have changed (need to update existing event)
    const datesChanged = existingEventId && (
      existingStartDate !== requestDoc.startDate || 
      existingEndDate !== requestDoc.endDate
    );

    if (existingEventId && datesChanged) {
      console.log('[CALENDAR] ensure_event update', { 
        id: requestDoc.id, 
        eventId: existingEventId,
        oldDates: { start: existingStartDate, end: existingEndDate },
        newDates: { start: requestDoc.startDate, end: requestDoc.endDate }
      });
      
      try {
        // Update existing event with new dates
        const eventId = await updateVacationInCalendar(existingEventId, vacationEvent);
        
        // Update sync timestamp
        await docRef.update({
          calendarSyncedAt: new Date().toISOString()
        });

        console.log('[CALENDAR] ensure_event updated', { id: requestDoc.id, eventId });
        return { success: true, eventId: eventId ?? undefined };
      } catch (updateError) {
        console.error('[CALENDAR] ensure_event update failed', { 
          id: requestDoc.id, 
          eventId: existingEventId,
          error: updateError instanceof Error ? updateError.message : String(updateError)
        });
        // Try to create a new event if update fails
        console.log('[CALENDAR] ensure_event retry create after update failure', { id: requestDoc.id });
      }
    }

    if (existingEventId && !datesChanged) {
      // Verify the event actually exists in Google Calendar
      try {
        const cal = calendarClient();
        
        try {
          await cal.events.get({
            calendarId: CAL_TARGET,
            eventId: existingEventId
          });
          // Event exists, all good
          console.log('[CALENDAR] ensure_event exists', { id: requestDoc.id, eventId: existingEventId });
          return { success: true, eventId: existingEventId };
        } catch (verifyError: any) {
          if (verifyError.code === 404) {
            // Event doesn't exist in calendar, clear stale ID and create new event
            console.log('[CALENDAR] ensure_event stale_id', { 
              id: requestDoc.id, 
              eventId: existingEventId,
              reason: 'Event ID exists in Firestore but not in Google Calendar'
            });
            
            // Clear the stale event ID
            await docRef.update({
              calendarEventId: null,
              googleCalendarEventId: null,
              googleEventId: null
            });
            
            // Fall through to create new event
          } else {
            // Other error, log and try to create anyway
            console.warn('[CALENDAR] ensure_event verify_error', { 
              id: requestDoc.id, 
              eventId: existingEventId,
              error: verifyError.message
            });
            // Fall through to create new event
          }
        }
      } catch (verifyError) {
        // If verification fails, log and proceed with creation
        console.warn('[CALENDAR] ensure_event verify_failed', { 
          id: requestDoc.id, 
          eventId: existingEventId,
          error: verifyError instanceof Error ? verifyError.message : String(verifyError)
        });
        // Fall through to create new event
      }
    }

    // Create new calendar event
    try {
      const eventId = await addVacationToCalendar(vacationEvent);
      console.log('[CALENDAR] ensure_event created', { id: requestDoc.id, eventId });

      // Store the event ID in Firestore for idempotency
      await docRef.update({
        calendarEventId: eventId,
        googleCalendarEventId: eventId, // Also store in legacy field for compatibility
        calendarSyncedAt: new Date().toISOString()
      });

      console.log('[CALENDAR] ensure_event stored', { id: requestDoc.id, eventId });

      return { success: true, eventId: eventId ?? undefined };
    } catch (createError) {
      const errorMessage = createError instanceof Error ? createError.message : String(createError);
      console.error('[CALENDAR] ensure_event create failed', { 
        id: requestDoc.id, 
        error: errorMessage,
        userName: requestDoc.userName,
        startDate: requestDoc.startDate,
        endDate: requestDoc.endDate
      });
      
      // Store error in Firestore for debugging
      try {
        await docRef.update({
          calendarSyncError: errorMessage,
          calendarSyncErrorAt: new Date().toISOString()
        });
      } catch (updateError) {
        console.error('[CALENDAR] Failed to store sync error', { id: requestDoc.id, updateError });
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CALENDAR] ensure_event fail', { 
      id: requestDoc.id, 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      success: false, 
      error: errorMessage
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
    const existingEventId = existingData?.calendarEventId || existingData?.googleCalendarEventId;

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
      googleCalendarEventId: null, // Also clear legacy field
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
    await revalidateTag('vacationRequests:list');
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
  try {
    console.log('[CALENDAR] sync_event start', { 
      id: requestDoc.id, 
      status: requestDoc.status,
      userName: requestDoc.userName
    });

    const { db, error } = getFirebaseAdmin();
    if (!db || error) {
      const errorMsg = `Firebase Admin not available: ${error || 'unknown error'}`;
      console.error('[CALENDAR] sync_event fail', { 
        id: requestDoc.id, 
        error: errorMsg 
      });
      return { 
        success: false, 
        error: errorMsg
      };
    }

    const normalizedStatus = normalizeVacationStatus(requestDoc.status);
    console.log('[CALENDAR] sync_event status', { 
      id: requestDoc.id, 
      originalStatus: requestDoc.status,
      normalizedStatus 
    });

    if (normalizedStatus === 'approved') {
      const result = await ensureEventForRequest(db, requestDoc);
      console.log('[CALENDAR] sync_event approved result', { 
        id: requestDoc.id, 
        success: result.success,
        eventId: result.eventId,
        error: result.error
      });
      return result;
    } else {
      const result = await deleteEventForRequest(db, requestDoc);
      console.log('[CALENDAR] sync_event delete result', { 
        id: requestDoc.id, 
        success: result.success,
        error: result.error
      });
      return result;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[CALENDAR] sync_event exception', { 
      id: requestDoc.id, 
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      success: false, 
      error: errorMessage
    };
  }
}
