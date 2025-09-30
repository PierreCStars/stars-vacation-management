export const runtime = 'nodejs';

import { getFirebaseAdmin } from '@/lib/firebase/admin';

export async function loadVacationRequests(limit = 50) {
  console.log('[VACATION_REQUESTS] start');
  console.time('[VACATION_REQUESTS] fetch');
  
  try {
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      throw new Error(`[VACATION_REQUESTS] Admin not ready: ${error ?? 'no db'}`);
    }
    
    console.log('[VACATION_REQUESTS] Firebase Admin connected, fetching data...');
    
    const snap = await db.collection('vacationRequests').limit(limit).get();
    const requests = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        // Convert Firestore timestamps to ISO strings safely
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null
      };
    });
    
    console.timeEnd('[VACATION_REQUESTS] fetch');
    console.log(`[VACATION_REQUESTS] loaded ${requests.length} requests`);
    
    return requests;
  } catch (error) {
    console.timeEnd('[VACATION_REQUESTS] fetch');
    console.error('[VACATION_REQUESTS] error:', error);
    throw error;
  }
}
