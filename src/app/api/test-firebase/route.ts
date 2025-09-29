import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { db, error } = getFirebaseAdmin();
    
    if (error || !db) {
      return NextResponse.json({ 
        ok: false, 
        error: error || 'Firestore not ready',
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    // Test write and read
    const testDoc = await db.collection('_diagnostics').doc('ping').set({
      timestamp: new Date(),
      test: 'firebase-connection'
    });

    const testRead = await db.collection('_diagnostics').doc('ping').get();
    
    return NextResponse.json({ 
      ok: true, 
      message: 'Firebase connection successful',
      data: {
        writeSuccess: !!testDoc,
        readSuccess: testRead.exists,
        readData: testRead.data(),
        timestamp: new Date().toISOString()
      }
    });

  } catch (e: any) {
    console.error('FIREBASE_TEST_ERROR', e);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? String(e),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}