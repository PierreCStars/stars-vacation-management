export const runtime = 'nodejs';

import { getFirebaseAdmin } from '@/lib/firebase/admin';

export async function loadVacationRequests(limit = 50) {
  console.log('[VACATION_REQUESTS] start');
  console.time('[VACATION_REQUESTS] fetch');
  
  try {
    console.log('[VACATION_REQUESTS] Getting Firebase Admin...');
    const { db, error } = getFirebaseAdmin();
    console.log('[VACATION_REQUESTS] Firebase Admin result:', { hasDb: !!db, error });
    
    if (error || !db) {
      console.error('[VACATION_REQUESTS] Firebase Admin failed:', error);
      console.log('[VACATION_REQUESTS] Falling back to API route...');
      
      // Fallback to API route when Firebase Admin is not available
      try {
        const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/vacation-requests`);
        if (response.ok) {
          const data = await response.json();
          console.log(`[VACATION_REQUESTS] Got ${data.length} requests from API fallback`);
          return data;
        }
      } catch (apiError) {
        console.error('[VACATION_REQUESTS] API fallback failed:', apiError);
      }
      
      throw new Error(`[VACATION_REQUESTS] Admin not ready: ${error ?? 'no db'}`);
    }
    
    console.log('[VACATION_REQUESTS] Firebase Admin connected, fetching data...');
    
    const snap = await db.collection('vacationRequests').limit(limit).get();
    console.log(`[VACATION_REQUESTS] Got ${snap.docs.length} documents from Firestore`);
    
    const requests = snap.docs.map((d, index) => {
      try {
        console.log(`[VACATION_REQUESTS] Processing document ${index + 1}/${snap.docs.length}: ${d.id}`);
        const data = d.data();
        
        const processedData = {
          id: d.id,
          ...data,
          // Convert ALL Firestore timestamps to ISO strings safely
          reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
        };
        
        console.log(`[VACATION_REQUESTS] Document ${d.id} processed successfully`);
        return processedData;
      } catch (docError) {
        console.error(`[VACATION_REQUESTS] Error processing document ${d.id}:`, docError);
        throw docError;
      }
    });
    
    console.timeEnd('[VACATION_REQUESTS] fetch');
    console.log(`[VACATION_REQUESTS] loaded ${requests.length} requests successfully`);
    
    return requests;
  } catch (error) {
    console.timeEnd('[VACATION_REQUESTS] fetch');
    console.error('[VACATION_REQUESTS] FATAL ERROR:', error);
    console.error('[VACATION_REQUESTS] Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error;
  }
}
