import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const { app, db, error } = getFirebaseAdmin();
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error,
        details: {
          projectId: process.env.FIREBASE_PROJECT_ID?.trim() ? 'present' : 'missing',
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim() ? 'present' : 'missing',
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim() ? 'present' : 'missing',
        }
      }, { status: 500 });
    }

    if (!app || !db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase app or database not initialized' 
      }, { status: 500 });
    }

    // Try to access Firestore
    try {
      const testDoc = await db.collection('_test').doc('ping').get();
      return NextResponse.json({ 
        success: true, 
        message: 'Service account working correctly',
        details: {
          projectId: app.options.projectId,
          serviceAccountEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim(),
          testDocExists: testDoc.exists
        }
      });
    } catch (firestoreError: any) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firestore access failed',
        details: {
          projectId: app.options.projectId,
          serviceAccountEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim(),
          firestoreError: firestoreError.message,
          errorCode: firestoreError.code,
          errorStatus: firestoreError.status
        }
      }, { status: 500 });
    }

  } catch (e: any) {
    return NextResponse.json({ 
      success: false, 
      error: 'Service account test failed',
      details: {
        error: e?.message ?? String(e),
        stack: e?.stack
      }
    }, { status: 500 });
  }
}
