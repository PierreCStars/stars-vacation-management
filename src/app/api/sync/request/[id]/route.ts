import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { normalizeVacationStatus } from '@/types/vacation-status';
import { initializeCalendarClient, CAL_TARGET } from '@/lib/google-calendar';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/sync/request/[id] - Check status of a specific vacation request
 * POST /api/sync/request/[id] - Force sync a specific vacation request to Google Calendar
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 Checking vacation request: ${id}`);

    // Get Firebase Admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json({
        error: 'Firebase Admin not available',
        details: error
      }, { status: 500 });
    }

    // Get the vacation request
    const docRef = db.collection('vacationRequests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        error: 'Vacation request not found',
        id
      }, { status: 404 });
    }

    const data = doc.data();
    const status = data?.status || 'unknown';
    const normalizedStatus = normalizeVacationStatus(status);
    const isApproved = normalizedStatus === 'approved';

    // Check for calendar event IDs
    const calendarEventId = data?.calendarEventId;
    const googleCalendarEventId = data?.googleCalendarEventId;
    const googleEventId = data?.googleEventId;
    const eventId = calendarEventId || googleCalendarEventId || googleEventId;

    // Check if event exists in Google Calendar
    let calendarEventExists = false;
    let calendarEventDetails = null;
    let calendarError = null;
    let calendarIdUsed = CAL_TARGET;

    if (eventId) {
      try {
        const { calendar } = initializeCalendarClient();
        const event = await calendar.events.get({
          calendarId: CAL_TARGET,
          eventId: eventId
        });
        calendarEventExists = true;
        calendarEventDetails = {
          summary: event.data.summary,
          start: event.data.start?.date || event.data.start?.dateTime,
          end: event.data.end?.date || event.data.end?.dateTime,
          status: event.data.status,
          htmlLink: event.data.htmlLink,
          calendarId: CAL_TARGET,
          eventId: event.data.id,
          created: event.data.created,
          updated: event.data.updated,
          visibility: event.data.visibility,
          transparency: event.data.transparency
        };
        console.log(`✅ Event ${eventId} found in calendar ${CAL_TARGET}`);
      } catch (error: any) {
        if (error.code === 404) {
          calendarEventExists = false;
          calendarError = 'Event not found in Google Calendar (may have been deleted)';
          console.log(`⚠️  Event ${eventId} not found in calendar ${CAL_TARGET}`);
        } else {
          calendarError = error.message || String(error);
          console.error(`❌ Error checking event ${eventId}:`, error);
        }
      }
    }

    return NextResponse.json({
      id,
      status,
      normalizedStatus,
      isApproved,
      hasEventId: !!eventId,
      eventId: eventId || null,
      calendarEventId,
      googleCalendarEventId,
      googleEventId,
      calendarEventExists,
      calendarEventDetails,
      calendarError,
      calendarId: calendarIdUsed,
      requestData: {
        userName: data?.userName,
        userEmail: data?.userEmail,
        startDate: data?.startDate,
        endDate: data?.endDate,
        company: data?.company,
        type: data?.type,
        reason: data?.reason
      },
      syncStatus: {
        needsSync: isApproved && !eventId,
        needsRecreate: isApproved && eventId && !calendarEventExists,
        isSynced: isApproved && eventId && calendarEventExists,
        canForceRecreate: isApproved && eventId && calendarEventExists
      },
      actions: {
        forceRecreate: isApproved && eventId 
          ? `POST /api/sync/request/${id}?force=true` 
          : null
      }
    });

  } catch (error) {
    console.error('❌ Error checking vacation request:', error);
    return NextResponse.json({
      error: 'Failed to check vacation request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check for force-recreate query parameter
    const url = new URL(request.url);
    const forceRecreate = url.searchParams.get('force') === 'true';
    
    console.log(`🔄 Force syncing vacation request: ${id}${forceRecreate ? ' (force recreate)' : ''}`);

    // Get Firebase Admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json({
        error: 'Firebase Admin not available',
        details: error
      }, { status: 500 });
    }

    // Get the vacation request
    const docRef = db.collection('vacationRequests').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        error: 'Vacation request not found',
        id
      }, { status: 404 });
    }

    const data = doc.data();
    const status = data?.status || 'unknown';
    const normalizedStatus = normalizeVacationStatus(status);

    if (normalizedStatus !== 'approved') {
      return NextResponse.json({
        error: 'Vacation request is not approved',
        id,
        status,
        normalizedStatus
      }, { status: 400 });
    }

    // Check if we need to clear a stale event ID
    const existingEventId = data?.calendarEventId || data?.googleCalendarEventId || data?.googleEventId;
    let shouldClearEventId = false;
    let eventExistsInCalendar = false;

    if (existingEventId && !forceRecreate) {
      try {
        const { calendar } = initializeCalendarClient();
        const event = await calendar.events.get({
          calendarId: CAL_TARGET,
          eventId: existingEventId
        });
        eventExistsInCalendar = true;
        console.log(`✅ Event ${existingEventId} exists in calendar, will update it`);
        // Event exists, we'll update it
      } catch (error: any) {
        if (error.code === 404) {
          // Event doesn't exist, clear the stale ID
          shouldClearEventId = true;
          console.log(`⚠️  Event ID ${existingEventId} not found in calendar, clearing stale ID`);
          await docRef.update({
            calendarEventId: null,
            googleCalendarEventId: null,
            googleEventId: null
          });
        } else {
          throw error;
        }
      }
    } else if (existingEventId && forceRecreate) {
      // Force recreate: delete existing event and clear ID
      console.log(`🔄 Force recreate: deleting existing event ${existingEventId} and creating new one`);
      try {
        const { calendar } = initializeCalendarClient();
        try {
          await calendar.events.delete({
            calendarId: CAL_TARGET,
            eventId: existingEventId
          });
          console.log(`✅ Deleted existing event ${existingEventId}`);
        } catch (deleteError: any) {
          if (deleteError.code !== 404) {
            console.warn(`⚠️  Could not delete event ${existingEventId}:`, deleteError.message);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error during force recreate cleanup:`, error);
      }
      
      // Clear the event ID
      shouldClearEventId = true;
      await docRef.update({
        calendarEventId: null,
        googleCalendarEventId: null,
        googleEventId: null
      });
    }

    // Prepare calendar data
    const calendarData = {
      id,
      userName: data?.userName || 'Unknown',
      userEmail: data?.userEmail || 'unknown@stars.mc',
      startDate: data?.startDate,
      endDate: data?.endDate,
      type: data?.type || 'VACATION',
      company: data?.company || 'Unknown',
      reason: data?.reason || 'N/A',
      status: 'approved' as const
    };

    // Validate required fields
    if (!calendarData.startDate || !calendarData.endDate) {
      return NextResponse.json({
        error: 'Missing required fields',
        id,
        missingFields: {
          startDate: !calendarData.startDate,
          endDate: !calendarData.endDate
        }
      }, { status: 400 });
    }

    // Sync the event
    const result = await syncEventForRequest(calendarData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        id,
        eventId: result.eventId,
        message: result.eventId 
          ? `Successfully synced vacation request to Google Calendar (Event ID: ${result.eventId})`
          : 'Successfully synced vacation request to Google Calendar',
        clearedStaleEventId: shouldClearEventId,
        forceRecreated: forceRecreate,
        previousEventId: forceRecreate ? existingEventId : null,
        calendarId: CAL_TARGET
      });
    } else {
      return NextResponse.json({
        success: false,
        id,
        error: result.error,
        message: `Failed to sync vacation request: ${result.error}`,
        calendarId: CAL_TARGET
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error syncing vacation request:', error);
    return NextResponse.json({
      error: 'Failed to sync vacation request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

