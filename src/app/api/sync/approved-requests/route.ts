import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { normalizeVacationStatus } from '@/types/vacation-status';
import { initializeCalendarClient, CANONICAL_SERVICE_ACCOUNT, ALTERNATIVE_SERVICE_ACCOUNT, CAL_TARGET } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    console.log('🚀 Starting sync of all approved vacation requests...');
    
    // Verify service account configuration before starting
    try {
      const { auth } = initializeCalendarClient();
      const actualServiceAccount = (auth as any).credentials?.client_email || 'unknown';
      const isCanonical = actualServiceAccount === CANONICAL_SERVICE_ACCOUNT;
      const isAlternative = actualServiceAccount === ALTERNATIVE_SERVICE_ACCOUNT;
      const isValidServiceAccount = isCanonical || isAlternative;
      
      console.log('[SYNC] Service account verification', {
        actual: actualServiceAccount,
        canonical: CANONICAL_SERVICE_ACCOUNT,
        alternative: ALTERNATIVE_SERVICE_ACCOUNT,
        isCanonical: isCanonical ? '✅' : '❌',
        isAlternative: isAlternative ? '✅' : '❌',
        isValid: isValidServiceAccount ? '✅ VALID' : '❌ UNKNOWN',
        calendarId: CAL_TARGET
      });
      
      if (!isValidServiceAccount) {
        console.warn('[SYNC] ⚠️ Unknown service account detected', {
          actual: actualServiceAccount,
          canonical: CANONICAL_SERVICE_ACCOUNT,
          alternative: ALTERNATIVE_SERVICE_ACCOUNT,
          message: 'This service account may not have calendar permissions',
          recommendation: `Use credentials for ${CANONICAL_SERVICE_ACCOUNT} (preferred) or ${ALTERNATIVE_SERVICE_ACCOUNT}`
        });
      }
    } catch (authError) {
      console.error('[SYNC] Failed to verify service account:', authError);
    }
    
    // Get Firebase Admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase Admin not available', 
        details: error 
      }, { status: 500 });
    }

    console.log(`📅 Fetching ALL validated vacation requests...`);
    
    // Get all vacation requests (not just last 30 days)
    const snapshot = await db.collection('vacationRequests').get();
    
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; status?: string; userName?: string; createdAt?: any; [key: string]: any }>;
    
    console.log(`📊 Found ${requests.length} total vacation requests`);
    
    // Filter approved/validated requests
    const approvedRequests = requests.filter(req => {
      const normalizedStatus = normalizeVacationStatus(req.status);
      return normalizedStatus === 'approved';
    });
    
    console.log(`✅ Found ${approvedRequests.length} approved/validated requests`);
    console.log(`🔄 Syncing all approved requests (syncEventForRequest will check if events exist)...`);
    
    // Sync each approved request
    // syncEventForRequest already handles:
    // - Checking if event ID exists
    // - Verifying event exists in Google Calendar
    // - Clearing stale event IDs
    // - Creating/updating events as needed
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];
    
    for (const req of approvedRequests) {
      try {
        console.log(`📅 Syncing request ${req.id} (${req.userName})...`);
        
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
          if (result.eventId) {
            console.log(`✅ Synced request ${req.id} (${req.userName}) - Event ID: ${result.eventId}`);
            successCount++;
          } else {
            // Event already exists, no action needed
            console.log(`⏭️  Request ${req.id} (${req.userName}) already synced - event exists`);
            skippedCount++;
          }
        } else {
          // Get actual service account for error context
          let actualServiceAccount = 'unknown';
          try {
            const { auth } = initializeCalendarClient();
            actualServiceAccount = (auth as any).credentials?.client_email || 'unknown';
          } catch (e) {
            // Ignore
          }
          
          // Include service account info in error if not already present
          const errorWithContext = result.error?.includes('Service Account:') 
            ? result.error 
            : `${result.error} (Service Account: ${actualServiceAccount})`;
          
          console.error(`❌ Failed to sync request ${req.id}:`, {
            error: result.error,
            serviceAccount: actualServiceAccount,
            calendarId: CAL_TARGET,
            requestId: req.id,
            userName: req.userName
          });
          
          errors.push({ 
            id: req.id, 
            error: errorWithContext,
            serviceAccount: actualServiceAccount
          });
          errorCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error syncing request ${req.id}:`, error);
        errors.push({ id: req.id, error: error instanceof Error ? error.message : String(error) });
        errorCount++;
      }
    }
    
    console.log('\n🎉 Sync completed!');
    console.log(`✅ Successfully synced: ${successCount} requests`);
    console.log(`❌ Failed to sync: ${errorCount} requests`);
    
    return NextResponse.json({
      success: true,
      totalApproved: approvedRequests.length,
      synced: successCount,
      skipped: skippedCount,
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${successCount} out of ${approvedRequests.length} approved vacation requests to Google Calendar (${skippedCount} already synced)`
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Sync failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
