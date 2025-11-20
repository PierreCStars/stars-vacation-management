/**
 * Sync all validated/approved vacation requests to Google Calendar
 * 
 * Usage:
 *   npx tsx scripts/sync-validated-vacations.ts
 * 
 * This script:
 * 1. Queries Firebase for all approved/validated vacation requests
 * 2. For each request, checks if a calendar event exists
 * 3. Creates events in the target Google Calendar for requests without events
 */

import { getFirebaseAdmin } from '../src/lib/firebaseAdmin';
import { syncEventForRequest } from '../src/lib/calendar/sync';
import { normalizeVacationStatus } from '../src/types/vacation-status';

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
  googleEventId?: string;
}

async function syncValidatedVacations() {
  console.log('\n🚀 Starting sync of validated/approved vacation requests...\n');

  const { db, error } = getFirebaseAdmin();
  if (error || !db) {
    throw new Error(`Firebase Admin not available: ${error}`);
  }

  console.log('📅 Fetching all vacation requests...');

  // Get all vacation requests
  const snapshot = await db.collection('vacationRequests').get();
  const allRequests = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as VacationRequest[];

  console.log(`📊 Found ${allRequests.length} total vacation requests`);

  // Filter approved/validated requests
  const approvedRequests = allRequests.filter(req => {
    const normalizedStatus = normalizeVacationStatus(req.status || '');
    return normalizedStatus === 'approved';
  });

  console.log(`✅ Found ${approvedRequests.length} approved/validated requests\n`);

  // Check which ones need calendar events
  const requestsNeedingSync: VacationRequest[] = [];
  for (const req of approvedRequests) {
    // Check all possible event ID fields for backward compatibility
    const existingEventId = req.calendarEventId || 
                            req.googleCalendarEventId || 
                            req.googleEventId;
    
    if (!existingEventId) {
      requestsNeedingSync.push(req);
    } else {
      console.log(`⏭️  Request ${req.id} (${req.userName}) already has calendar event: ${existingEventId}`);
    }
  }

  console.log(`🔄 ${requestsNeedingSync.length} requests need calendar sync\n`);

  if (requestsNeedingSync.length === 0) {
    console.log('✅ All validated/approved requests are already synced to Google Calendar!');
    return;
  }

  // Sync each request
  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: string; userName: string; error: string }> = [];

  for (const req of requestsNeedingSync) {
    try {
      console.log(`📅 Syncing request ${req.id} (${req.userName || 'Unknown'})...`);
      console.log(`   Dates: ${req.startDate} to ${req.endDate}`);
      console.log(`   Company: ${req.company || 'Unknown'}`);
      
      const calendarData = {
        id: req.id,
        userName: req.userName || 'Unknown',
        userEmail: req.userEmail || 'unknown@stars.mc',
        startDate: req.startDate,
        endDate: req.endDate,
        type: req.type || 'VACATION',
        company: req.company || 'Unknown',
        reason: req.reason || 'N/A',
        status: 'approved' as const
      };
      
      const result = await syncEventForRequest(calendarData);
      
      if (result.success) {
        console.log(`   ✅ Created calendar event: ${result.eventId || 'N/A'}\n`);
        successCount++;
      } else {
        console.log(`   ❌ Failed: ${result.error}\n`);
        errors.push({ id: req.id, userName: req.userName || 'Unknown', error: result.error || 'Unknown error' });
        errorCount++;
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`   ❌ Error: ${errorMessage}\n`);
      errors.push({ id: req.id, userName: req.userName || 'Unknown', error: errorMessage });
      errorCount++;
    }
  }

  console.log('\n🎉 Sync completed!');
  console.log(`✅ Successfully synced: ${successCount} requests`);
  console.log(`❌ Failed to sync: ${errorCount} requests`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach(err => {
      console.log(`   - ${err.userName} (${err.id}): ${err.error}`);
    });
  }

  if (successCount > 0) {
    console.log('\n📅 Check your Google Calendar to see the synced events!');
  }
}

// Run the sync
syncValidatedVacations().catch(error => {
  console.error('❌ Sync failed:', error);
  process.exit(1);
});

