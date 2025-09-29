import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      // Client variables
      NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      
      // Admin variables
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
      FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'SET' : 'NOT_SET',
      
      // Legacy variables (should be removed)
      VITE_ENABLE_FIREBASE: process.env.VITE_ENABLE_FIREBASE,
      VITE_FIREBASE_PROJECT_ID: process.env.VITE_FIREBASE_PROJECT_ID,
    };

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      variables: envCheck,
      summary: {
        firebaseEnabled: process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true',
        clientConfigComplete: [
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID'
        ].every(key => !!process.env[key]),
        adminConfigComplete: [
          'FIREBASE_PROJECT_ID',
          'FIREBASE_ADMIN_CLIENT_EMAIL',
          'FIREBASE_ADMIN_PRIVATE_KEY'
        ].every(key => !!process.env[key])
      }
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Environment check failed',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}