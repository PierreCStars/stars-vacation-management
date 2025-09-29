import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Check environment variables
    const requiredVars = [
      'NEXT_PUBLIC_ENABLE_FIREBASE',
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_ADMIN_PRIVATE_KEY'
    ];

    const envStatus = requiredVars.map(varName => ({
      name: varName,
      exists: !!process.env[varName],
      value: process.env[varName] ? 
        (process.env[varName]!.length > 50 ? 
          process.env[varName]!.substring(0, 50) + '...' : 
          process.env[varName]) : 
        'MISSING'
    }));

    const firebaseEnabled = process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true';
    const clientConfigComplete = requiredVars.slice(0, 7).every(v => !!process.env[v]);
    const adminConfigComplete = requiredVars.slice(7).every(v => !!process.env[v]);

    // Test Firebase client initialization
    let firebaseTest = { success: false, error: null };
    if (firebaseEnabled) {
      try {
        // Try to import and initialize Firebase client
        const { getFirebase } = await import('@/lib/firebase');
        const firebase = getFirebase();
        
        if (firebase && firebase.app && firebase.db) {
          firebaseTest = { success: true, error: null };
        } else {
          firebaseTest = { success: false, error: 'Firebase client initialized but app/db is undefined' };
        }
      } catch (error) {
        firebaseTest = { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }

    // Test Firebase Admin
    let adminTest = { success: false, error: null };
    if (adminConfigComplete) {
      try {
        const { getFirebaseAdminApp } = await import('@/lib/firebase');
        const app = getFirebaseAdminApp();
        adminTest = { success: true, error: null };
      } catch (error) {
        adminTest = { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        };
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: {
        firebaseEnabled,
        clientConfigComplete,
        adminConfigComplete,
        variables: envStatus
      },
      tests: {
        firebaseClient: firebaseTest,
        firebaseAdmin: adminTest
      },
      summary: {
        overall: firebaseEnabled && clientConfigComplete && firebaseTest.success,
        issues: [
          ...(firebaseEnabled ? [] : ['Firebase is disabled']),
          ...(clientConfigComplete ? [] : ['Client configuration incomplete']),
          ...(adminConfigComplete ? [] : ['Admin configuration incomplete']),
          ...(firebaseTest.success ? [] : [`Firebase client error: ${firebaseTest.error}`]),
          ...(adminTest.success ? [] : [`Firebase admin error: ${adminTest.error}`])
        ]
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
