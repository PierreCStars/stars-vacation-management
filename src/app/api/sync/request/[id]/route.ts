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
          htmlLink: event.data.htmlLink
        };
      } catch (error: any) {
        if (error.code === 404) {
          calendarEventExists = false;
          calendarError = 'Event not found in Google Calendar (may have been deleted)';
        } else {
          calendarError = error.message || String(error);
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
        isSynced: isApproved && eventId && calendarEventExists
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
    console.log(`🔄 Force syncing vacation request: ${id}`);

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

    if (existingEventId) {
      try {
        const { calendar } = initializeCalendarClient();
        await calendar.events.get({
          calendarId: CAL_TARGET,
          eventId: existingEventId
        });
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
        clearedStaleEventId: shouldClearEventId
      });
    } else {
      return NextResponse.json({
        success: false,
        id,
        error: result.error,
        message: `Failed to sync vacation request: ${result.error}`
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

