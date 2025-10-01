/**
 * Firebase Admin Diagnostics Route
 * 
 * Server-only diagnostic endpoint to verify Firebase Admin configuration.
 * This route should NEVER be imported by client code.
 * 
 * Runtime: Node.js only
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Helper to normalize private key (same as in firebaseAdmin.ts)
function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, '\n');
}

// Helper to parse service account key
function parseServiceAccountKey(serviceAccountKey: string) {
  try {
    // Remove single quotes if present (same as in firebaseAdmin.ts)
    let keyString = serviceAccountKey;
    if (keyString.startsWith("'")) {
      keyString = keyString.slice(1);
    }
    if (keyString.endsWith("'")) {
      keyString = keyString.slice(0, -1);
    }
    
    const parsed = JSON.parse(keyString);
    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key
    };
  } catch (error) {
    console.error('[FIREBASE_DIAG] JSON parse error:', error);
    return null;
  }
}

export async function GET() {
  console.log('[FIREBASE_DIAG] Starting Firebase Admin diagnostics...');
  
  const diagnostics = {
    env: {
      PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? 'set' : 'missing',
      SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 'set' : 'missing',
      CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'missing',
      PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'set' : 'missing',
      PRIVATE_KEY_LENGTH: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
      PRIVATE_KEY_NEWLINES: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.includes('\n') || false,
      NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE || 'missing'
    },
    credential: {
      projectIdFromKey: null as string | null,
      clientEmailFromKey: null as string | null,
      keyParseable: false
    },
    admin: {
      initialized: false,
      firestorePing: 'not_attempted' as string
    },
    errors: [] as string[]
  };

  // Check environment variables
  console.log('[FIREBASE_DIAG] Environment check:', {
    PROJECT_ID: diagnostics.env.PROJECT_ID,
    SERVICE_ACCOUNT_KEY: diagnostics.env.SERVICE_ACCOUNT_KEY,
    CLIENT_EMAIL: diagnostics.env.CLIENT_EMAIL,
    PRIVATE_KEY: diagnostics.env.PRIVATE_KEY,
    PRIVATE_KEY_LENGTH: diagnostics.env.PRIVATE_KEY_LENGTH,
    PRIVATE_KEY_NEWLINES: diagnostics.env.PRIVATE_KEY_NEWLINES,
    NEXT_PUBLIC_ENABLE_FIREBASE: diagnostics.env.NEXT_PUBLIC_ENABLE_FIREBASE
  });

  // Parse service account key if available
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      console.log('[FIREBASE_DIAG] Attempting to parse service account key...');
      const keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      console.log('[FIREBASE_DIAG] Key length:', keyString.length);
      console.log('[FIREBASE_DIAG] Key starts with:', keyString.substring(0, 50));
      
      const parsed = parseServiceAccountKey(keyString);
      if (parsed) {
        diagnostics.credential.projectIdFromKey = parsed.projectId;
        diagnostics.credential.clientEmailFromKey = parsed.clientEmail;
        diagnostics.credential.keyParseable = true;
        console.log('[FIREBASE_DIAG] Service account key parsed successfully:', {
          projectId: parsed.projectId,
          clientEmail: parsed.clientEmail,
          privateKeyLength: parsed.privateKey.length
        });
      } else {
        diagnostics.errors.push('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY - returned null');
      }
    } catch (error) {
      const errorMsg = `Error parsing service account key: ${error instanceof Error ? error.message : String(error)}`;
      diagnostics.errors.push(errorMsg);
      console.error('[FIREBASE_DIAG]', errorMsg);
      console.error('[FIREBASE_DIAG] Full error:', error);
    }
  } else {
    diagnostics.errors.push('FIREBASE_SERVICE_ACCOUNT_KEY not found');
  }

  // Check if Firebase Admin is already initialized
  try {
    const apps = getApps();
    if (apps.length > 0) {
      diagnostics.admin.initialized = true;
      console.log('[FIREBASE_DIAG] Firebase Admin already initialized');
      
      // Test Firestore connection
      try {
        const db = getFirestore(apps[0]);
        // Try to read a document to test permissions
        const testDoc = await db.collection('_diagnostics').doc('ping').get();
        diagnostics.admin.firestorePing = 'ok';
        console.log('[FIREBASE_DIAG] Firestore ping successful');
      } catch (firestoreError) {
        diagnostics.admin.firestorePing = `error: ${firestoreError instanceof Error ? firestoreError.message : String(firestoreError)}`;
        console.error('[FIREBASE_DIAG] Firestore ping failed:', firestoreError);
      }
    } else {
      console.log('[FIREBASE_DIAG] Firebase Admin not initialized');
    }
  } catch (error) {
    diagnostics.errors.push(`Error checking Firebase Admin: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Validate environment consistency
  if (diagnostics.credential.projectIdFromKey && diagnostics.env.PROJECT_ID === 'set') {
    if (diagnostics.credential.projectIdFromKey !== process.env.FIREBASE_PROJECT_ID) {
      diagnostics.errors.push(`Project ID mismatch: key has ${diagnostics.credential.projectIdFromKey}, env has ${process.env.FIREBASE_PROJECT_ID}`);
    }
  }

  if (diagnostics.credential.clientEmailFromKey && diagnostics.env.CLIENT_EMAIL !== 'missing') {
    if (diagnostics.credential.clientEmailFromKey !== process.env.FIREBASE_ADMIN_CLIENT_EMAIL) {
      diagnostics.errors.push(`Client email mismatch: key has ${diagnostics.credential.clientEmailFromKey}, env has ${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`);
    }
  }

  // Check if client email matches project ID pattern
  if (diagnostics.env.CLIENT_EMAIL !== 'missing' && diagnostics.env.PROJECT_ID === 'set') {
    const expectedSuffix = `@${process.env.FIREBASE_PROJECT_ID}.iam.gserviceaccount.com`;
    if (!diagnostics.env.CLIENT_EMAIL.endsWith(expectedSuffix)) {
      diagnostics.errors.push(`Client email should end with ${expectedSuffix}`);
    }
  }

  console.log('[FIREBASE_DIAG] Diagnostics complete:', diagnostics);

  return NextResponse.json(diagnostics, {
    status: diagnostics.errors.length > 0 ? 200 : 200, // Always return 200, but include errors in response
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}
