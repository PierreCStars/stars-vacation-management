import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    const { db, error } = getFirebaseAdmin();
    
    if (error || !db) {
      console.log('❌ Firebase connection failed:', error);
      return NextResponse.json({
        success: false,
        error: 'Firebase connection failed',
        details: error,
        message: 'Firebase Admin SDK could not be initialized'
      }, { status: 500 });
    }

    console.log('✅ Firebase Admin SDK initialized successfully');
    
    // Try to query a collection
    try {
      const snapshot = await db.collection('vacationRequests').get();
      console.log(`📊 Firebase query successful: ${snapshot.docs.length} documents found`);
      
      return NextResponse.json({
        success: true,
        message: 'Firebase connection successful',
        documentCount: snapshot.docs.length,
        documents: snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }))
      });
    } catch (queryError) {
      console.error('❌ Firebase query failed:', queryError);
      return NextResponse.json({
        success: false,
        error: 'Firebase query failed',
        details: queryError instanceof Error ? queryError.message : String(queryError),
        message: 'Could not query Firebase collection'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Test Firebase error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Firebase test failed'
    }, { status: 500 });
  }
}