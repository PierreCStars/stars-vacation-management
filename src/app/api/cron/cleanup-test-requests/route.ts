import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { calendarClient, CAL_TARGET } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Cron endpoint to delete test user vacation requests older than 24 hours
 * 
 * Schedule: Run once daily at 1:00 AM UTC to catch requests that have been around for 24+ hours
 * Vercel Cron: 0 1 * * * (runs once daily at 1:00 AM UTC)
 * Note: Hobby accounts are limited to daily cron jobs
 * 
 * This endpoint:
 * 1. Finds all vacation requests from test@stars.mc
 * 2. Checks if they're older than 24 hours
 * 3. Deletes the calendar event if it exists
 * 4. Deletes the Firestore document
 * 
 * Environment variables:
 * - TEST_USER_CLEANUP_ENABLED: Set to 'false' to disable cleanup (default: true)
 */
export async function GET() {
  try {
    const cleanupEnabled = process.env.TEST_USER_CLEANUP_ENABLED !== 'false';
    
    if (!cleanupEnabled) {
      console.log('[CLEANUP_TEST] Cleanup disabled via TEST_USER_CLEANUP_ENABLED');
      return NextResponse.json({
        success: true,
        message: 'Test user cleanup is disabled',
        enabled: false
      });
    }

    console.log('[CLEANUP_TEST] Starting cleanup of test user vacation requests...');
    
    // Get Firebase Admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('[CLEANUP_TEST] ❌ Firebase Admin not available:', error);
      return NextResponse.json({
        success: false,
        error: 'Firebase Admin not available',
        details: error
      }, { status: 500 });
    }

    // Calculate 24 hours ago
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('[CLEANUP_TEST] Looking for test requests created before:', twentyFourHoursAgo.toISOString());

    // Find all test user requests older than 24 hours
    const testUserEmail = 'test@stars.mc';
    const { Timestamp } = await import('firebase-admin/firestore');
    const twentyFourHoursAgoTimestamp = Timestamp.fromDate(twentyFourHoursAgo);
    
    const snapshot = await db.collection('vacationRequests')
      .where('userEmail', '==', testUserEmail)
      .where('createdAt', '<', twentyFourHoursAgoTimestamp)
      .get();

    const requestsToDelete = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ 
      id: string; 
      userName?: string; 
      calendarEventId?: string; 
      googleCalendarEventId?: string; 
      googleEventId?: string;
      [key: string]: any;
    }>;

    console.log(`[CLEANUP_TEST] Found ${requestsToDelete.length} test requests to delete`);

    if (requestsToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No test requests to delete',
        deleted: 0,
        timestamp: new Date().toISOString()
      });
    }

    let deletedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Delete each request
    for (const request of requestsToDelete) {
      try {
        console.log(`[CLEANUP_TEST] Deleting request ${request.id} (${request.userName})...`);

        // Delete calendar event if it exists
        const eventId = request.calendarEventId || request.googleCalendarEventId || request.googleEventId;
        if (eventId) {
          try {
            const cal = calendarClient();
            await cal.events.delete({
              calendarId: CAL_TARGET,
              eventId: eventId
            });
            console.log(`[CLEANUP_TEST] ✅ Deleted calendar event ${eventId} for request ${request.id}`);
          } catch (calendarError: any) {
            // If event doesn't exist (404), that's okay - continue with deletion
            if (calendarError.code !== 404) {
              console.warn(`[CLEANUP_TEST] ⚠️  Failed to delete calendar event ${eventId}:`, calendarError.message);
              // Continue anyway - we'll still delete the Firestore document
            }
          }
        }

        // Delete Firestore document
        await db.collection('vacationRequests').doc(request.id).delete();
        console.log(`[CLEANUP_TEST] ✅ Deleted Firestore document ${request.id}`);
        deletedCount++;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[CLEANUP_TEST] ❌ Failed to delete request ${request.id}:`, errorMessage);
        errors.push(`Request ${request.id}: ${errorMessage}`);
        errorCount++;
      }
    }

    console.log(`[CLEANUP_TEST] ✅ Cleanup completed: ${deletedCount} deleted, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} test user vacation request${deletedCount !== 1 ? 's' : ''}`,
      deleted: deletedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CLEANUP_TEST] ❌ Error in cleanup:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST for manual triggering
export async function POST() {
  return GET();
}

