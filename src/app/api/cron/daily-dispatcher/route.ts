import { NextResponse } from 'next/server';
import { runPendingReminder5d, ReminderResult } from '@/lib/cron/pendingReminder5d';
import { safeNextJson } from '@/lib/http/safeJson';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { calendarClient, CAL_TARGET } from '@/lib/google-calendar';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Daily Dispatcher Cron Job
 * 
 * Schedule: Daily at 08:00 UTC (09:00 Europe/Monaco)
 * Vercel Cron: 0 8 * * *
 * 
 * This consolidated dispatcher handles multiple daily tasks:
 * 1. Pending Reminder (5d) - Sends reminders for pending vacation requests older than 5 days
 * 2. Cleanup Test Requests - Removes test user requests older than 24 hours (optional)
 * 
 * This consolidation allows us to stay within Vercel's 2-cron-job limit while
 * maintaining all critical functionality.
 */
export async function GET() {
  const results = {
    timestamp: new Date().toISOString(),
    tasks: {
      pendingReminder: null as ReminderResult | null,
      cleanup: null as any
    },
    success: true,
    errors: [] as string[]
  };

  try {
    console.log('[DAILY_DISPATCHER] Starting daily tasks...');

    // Task 1: Pending Reminder (5d) - CRITICAL
    try {
      console.log('[DAILY_DISPATCHER] Running pending reminder check...');
      const reminderResult = await runPendingReminder5d();
      results.tasks.pendingReminder = reminderResult;
      
      if (reminderResult.included === 0) {
        console.log('[DAILY_DISPATCHER] ✅ Pending reminder: No requests need reminder');
      } else {
        console.log(`[DAILY_DISPATCHER] ✅ Pending reminder: ${reminderResult.included} requests included, ${reminderResult.notified} admins notified`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DAILY_DISPATCHER] ❌ Error in pending reminder:', errorMessage);
      results.errors.push(`Pending reminder: ${errorMessage}`);
      results.success = false;
    }

    // Task 2: Cleanup Test Requests - OPTIONAL (can be disabled)
    try {
      const cleanupEnabled = process.env.TEST_USER_CLEANUP_ENABLED !== 'false';
      
      if (!cleanupEnabled) {
        console.log('[DAILY_DISPATCHER] Cleanup disabled via TEST_USER_CLEANUP_ENABLED');
        results.tasks.cleanup = {
          enabled: false,
          message: 'Test user cleanup is disabled'
        };
      } else {
        console.log('[DAILY_DISPATCHER] Running test requests cleanup...');
        const cleanupResult = await cleanupTestRequests();
        results.tasks.cleanup = cleanupResult;
        console.log(`[DAILY_DISPATCHER] ✅ Cleanup: ${cleanupResult.deleted || 0} test requests deleted`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[DAILY_DISPATCHER] ❌ Error in cleanup:', errorMessage);
      results.errors.push(`Cleanup: ${errorMessage}`);
      // Don't mark overall as failed for cleanup errors (non-critical)
    }

    console.log('[DAILY_DISPATCHER] ✅ Daily dispatcher completed');

    return safeNextJson(results, {
      success: results.success,
      message: 'Daily dispatcher completed',
      ...results
    });

  } catch (error) {
    console.error('[DAILY_DISPATCHER] ❌ Fatal error in daily dispatcher:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      ...results
    }, { status: 500 });
  }
}

// Allow POST for manual triggering
export async function POST() {
  return GET();
}

/**
 * Cleanup test user vacation requests older than 24 hours
 * Extracted from /api/cron/cleanup-test-requests for consolidation
 */
async function cleanupTestRequests() {
  // Get Firebase Admin
  const { db, error } = getFirebaseAdmin();
  if (error || !db) {
    throw new Error(`Firebase Admin not available: ${error}`);
  }

  // Calculate 24 hours ago
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

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

  if (requestsToDelete.length === 0) {
    return {
      success: true,
      message: 'No test requests to delete',
      deleted: 0
    };
  }

  let deletedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  // Delete each request
  for (const request of requestsToDelete) {
    try {
      // Delete calendar event if it exists
      const eventId = request.calendarEventId || request.googleCalendarEventId || request.googleEventId;
      if (eventId) {
        try {
          const cal = calendarClient();
          await cal.events.delete({
            calendarId: CAL_TARGET,
            eventId: eventId
          });
        } catch (calendarError: any) {
          // If event doesn't exist (404), that's okay - continue with deletion
          if (calendarError.code !== 404) {
            console.warn(`[CLEANUP] ⚠️  Failed to delete calendar event ${eventId}:`, calendarError.message);
          }
        }
      }

      // Delete Firestore document
      await db.collection('vacationRequests').doc(request.id).delete();
      deletedCount++;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Request ${request.id}: ${errorMessage}`);
      errorCount++;
    }
  }

  return {
    success: true,
    message: `Deleted ${deletedCount} test user vacation request${deletedCount !== 1 ? 's' : ''}`,
    deleted: deletedCount,
    errors: errorCount,
    errorDetails: errors.length > 0 ? errors : undefined
  };
}

