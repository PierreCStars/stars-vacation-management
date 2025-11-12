/**
 * Reconciliation script to backfill missing calendar events for approved vacation requests
 * 
 * Usage:
 *   npx tsx scripts/reconcile-vacations-to-calendar.ts [--days=90] [--dry-run]
 * 
 * This script:
 * 1. Queries Firebase for approved vacation requests in the last N days (default 90)
 * 2. For each request, checks if a calendar event exists
 * 3. Creates/updates events in the target Google Calendar
 * 4. Generates a reconciliation report
 */

import { getFirebaseAdmin } from '../src/lib/firebaseAdmin';
import { syncEventForRequest } from '../src/lib/calendar/sync';
import { normalizeVacationStatus } from '../src/types/vacation-status';

interface ReconciliationResult {
  totalApproved: number;
  alreadySynced: number;
  newlySynced: number;
  updated: number;
  failed: number;
  errors: Array<{ id: string; userName: string; error: string }>;
  skipped: number;
}

interface VacationRequest {
  id: string;
  userName?: string;
  userEmail?: string;
  startDate: string;
  endDate: string;
  type?: string;
  company?: string;
  reason?: string;
  status?: string;
  calendarEventId?: string;
  googleCalendarEventId?: string;
  calendarSyncedAt?: string;
}

async function reconcileVacationsToCalendar(
  days: number = 90,
  dryRun: boolean = false
): Promise<ReconciliationResult> {
  console.log(`\n🔍 Starting reconciliation (last ${days} days, dry-run: ${dryRun})...\n`);

  const { db, error } = getFirebaseAdmin();
  if (error || !db) {
    throw new Error(`Firebase Admin not available: ${error}`);
  }

  // Calculate date threshold
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - days);
  const thresholdISO = thresholdDate.toISOString().split('T')[0];

  console.log(`📅 Fetching approved vacation requests since ${thresholdISO}...`);

  // Get all vacation requests
  const snapshot = await db.collection('vacationRequests').get();
  const allRequests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as VacationRequest[];

  console.log(`📊 Found ${allRequests.length} total vacation requests`);

  // Filter approved requests within date range
  const approvedRequests = allRequests.filter(req => {
    const normalizedStatus = normalizeVacationStatus(req.status || '');
    const isApproved = normalizedStatus === 'approved';
    const isInRange = req.startDate && req.startDate >= thresholdISO;
    return isApproved && isInRange;
  });

  console.log(`✅ Found ${approvedRequests.length} approved requests in the last ${days} days\n`);

  const result: ReconciliationResult = {
    totalApproved: approvedRequests.length,
    alreadySynced: 0,
    newlySynced: 0,
    updated: 0,
    failed: 0,
    errors: [],
    skipped: 0
  };

  // Process each request
  for (const req of approvedRequests) {
    try {
      const existingEventId = req.calendarEventId || req.googleCalendarEventId;
      const hasEventId = !!existingEventId;

      console.log(`\n📋 Processing: ${req.userName || 'Unknown'} (${req.id})`);
      console.log(`   Dates: ${req.startDate} to ${req.endDate}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Existing Event ID: ${existingEventId || 'None'}`);

      if (dryRun) {
        if (hasEventId) {
          result.alreadySynced++;
          console.log(`   [DRY RUN] Would skip (already has event ID)`);
        } else {
          result.newlySynced++;
          console.log(`   [DRY RUN] Would create calendar event`);
        }
        continue;
      }

      // Prepare calendar data
      const calendarData = {
        id: req.id,
        userName: req.userName || 'Unknown',
        userEmail: req.userEmail || 'unknown@stars.mc',
        startDate: req.startDate,
        endDate: req.endDate,
        type: req.type || 'Full day',
        company: req.company || 'Unknown',
        reason: req.reason,
        status: 'approved' as const
      };

      // Sync the event
      const syncResult = await syncEventForRequest(calendarData);

      if (syncResult.success) {
        if (hasEventId) {
          // Check if dates changed (would trigger update)
          const docRef = db.collection('vacationRequests').doc(req.id);
          const doc = await docRef.get();
          const currentData = doc.data();
          const datesChanged = 
            currentData?.startDate !== req.startDate || 
            currentData?.endDate !== req.endDate;

          if (datesChanged) {
            result.updated++;
            console.log(`   ✅ Updated calendar event (dates changed)`);
          } else {
            result.alreadySynced++;
            console.log(`   ✅ Already synced (no changes)`);
          }
        } else {
          result.newlySynced++;
          console.log(`   ✅ Created calendar event: ${syncResult.eventId || 'N/A'}`);
        }
      } else {
        result.failed++;
        const errorMsg = syncResult.error || 'Unknown error';
        result.errors.push({
          id: req.id,
          userName: req.userName || 'Unknown',
          error: errorMsg
        });
        console.error(`   ❌ Failed: ${errorMsg}`);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      result.failed++;
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push({
        id: req.id,
        userName: req.userName || 'Unknown',
        error: errorMsg
      });
      console.error(`   ❌ Error: ${errorMsg}`);
    }
  }

  return result;
}

function printReport(result: ReconciliationResult, dryRun: boolean) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RECONCILIATION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Approved Requests: ${result.totalApproved}`);
  console.log(`Already Synced: ${result.alreadySynced}`);
  if (dryRun) {
    console.log(`Would Create: ${result.newlySynced}`);
  } else {
    console.log(`Newly Synced: ${result.newlySynced}`);
    console.log(`Updated: ${result.updated}`);
  }
  console.log(`Failed: ${result.failed}`);
  console.log(`Skipped: ${result.skipped}`);
  
  if (result.errors.length > 0) {
    console.log('\n❌ ERRORS:');
    result.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.userName} (${err.id}): ${err.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN. No changes were made.');
    console.log('   Run without --dry-run to actually sync events.\n');
  } else {
    console.log('\n✅ Reconciliation complete!\n');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const daysArg = args.find(arg => arg.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 90;
  const dryRun = args.includes('--dry-run');

  try {
    const result = await reconcileVacationsToCalendar(days, dryRun);
    printReport(result, dryRun);
    
    // Exit with error code if there were failures
    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Reconciliation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { reconcileVacationsToCalendar, printReport };

