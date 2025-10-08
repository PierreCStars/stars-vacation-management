import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('[DEBUG] Testing Firebase connection...');
    
    const { db, error } = getFirebaseAdmin();
    
    if (error || !db) {
      console.log('[DEBUG] Firebase connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Firebase connection failed',
        details: error,
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
        firebaseEnabled: process.env.NEXT_PUBLIC_ENABLE_FIREBASE
      }, { status: 500 });
    }

    console.log('[DEBUG] Firebase Admin SDK initialized successfully');
    
    // Try to query the vacationRequests collection
    try {
      const snapshot = await db.collection('vacationRequests').limit(5).get();
      console.log(`[DEBUG] Firebase query successful: ${snapshot.docs.length} documents found`);
      
      const firstDocsSample = snapshot.docs.slice(0, 3).map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      
      return NextResponse.json({
        success: true,
        projectId: process.env.FIREBASE_PROJECT_ID,
        count: snapshot.docs.length,
        ids: snapshot.docs.map(doc => doc.id),
        firstDocsSample,
        firebaseEnabled: process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
        message: 'Firebase connection successful'
      });
    } catch (queryError) {
      console.error('[DEBUG] Firebase query failed:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Firebase query failed',
        details: queryError instanceof Error ? queryError.message : String(queryError),
        projectId: process.env.FIREBASE_PROJECT_ID,
        message: 'Could not query Firebase collection'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[DEBUG] Test Firebase error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId: process.env.FIREBASE_PROJECT_ID,
      message: 'Firebase test failed'
    }, { status: 500 });
  }
}
