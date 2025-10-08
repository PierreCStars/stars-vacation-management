import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { syncEventForRequest } from '@/lib/calendar/sync';
import { normalizeVacationStatus } from '@/types/vacation-status';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST() {
  try {
    console.log('🚀 Starting sync of all approved vacation requests...');
    
    // Get Firebase Admin
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase Admin not available', 
        details: error 
      }, { status: 500 });
    }

    // Get all vacation requests
    const snapshot = await db.collection('vacationRequests').get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; status?: string; userName?: string; [key: string]: any }>;
    
    console.log(`📊 Found ${requests.length} total vacation requests`);
    
    // Filter approved requests
    const approvedRequests = requests.filter(req => {
      const normalizedStatus = normalizeVacationStatus(req.status);
      return normalizedStatus === 'approved';
    });
    
    console.log(`✅ Found ${approvedRequests.length} approved requests`);
    
    // Check which ones need calendar events
    const requestsNeedingSync = [];
    for (const req of approvedRequests) {
      const docRef = db.collection('vacationRequests').doc(req.id);
      const doc = await docRef.get();
      const existingData = doc.data();
      const existingEventId = existingData?.calendarEventId;
      
      if (!existingEventId) {
        requestsNeedingSync.push(req);
      } else {
        console.log(`⏭️  Request ${req.id} already has calendar event: ${existingEventId}`);
      }
    }
    
    console.log(`🔄 ${requestsNeedingSync.length} requests need calendar sync`);
    
    // Sync each request
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const req of requestsNeedingSync) {
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
          console.log(`✅ Synced request ${req.id} - Event ID: ${result.eventId || 'N/A'}`);
          successCount++;
        } else {
          console.error(`❌ Failed to sync request ${req.id}: ${result.error}`);
          errors.push({ id: req.id, error: result.error });
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
      failed: errorCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${successCount} out of ${approvedRequests.length} approved vacation requests to Google Calendar`
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
