// src/lib/firebaseAdmin.ts
import type { App } from 'firebase-admin/app';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { assertFirebaseEnv } from '@/lib/env/required';

function normalizePrivateKey(key?: string) {
  if (!key) return '';
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

export function getFirebaseAdmin(): {
  app: App | null;
  db: FirebaseFirestore.Firestore | null;
  error: string | null;
} {
  // Check if Firebase is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE?.trim() !== 'true') {
    console.log('🔧 Firebase Admin is disabled (NEXT_PUBLIC_ENABLE_FIREBASE !== true)');
    return { app: null, db: null, error: 'Firebase is disabled' };
  }

  // Validate Firebase environment variables
  try {
    assertFirebaseEnv();
  } catch (error) {
    console.error('❌ Firebase Admin environment validation failed:', error);
    return { app: null, db: null, error: (error as Error).message };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

          console.log('🔍 [INVESTIGATION] Firebase Admin init projectId=', projectId);
          console.log('🔍 [INVESTIGATION] Firebase Admin init clientEmail=', clientEmail);
          console.log('🔍 [INVESTIGATION] Firebase Admin init privateKey length=', privateKey?.length || 0);
          console.log('🔍 [INVESTIGATION] Firebase Admin runtime=', process.env.NEXT_RUNTIME || 'unknown');
          console.log('🔍 [INVESTIGATION] Firebase Admin Vercel region=', process.env.VERCEL_REGION || 'unknown');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('[FIREBASE] Missing required environment variables:', {
      projectId: !!projectId,
      clientEmail: !!clientEmail,
      privateKey: !!privateKey
    });
    return { app: null, db: null, error: 'Missing Firebase Admin envs' };
  }

  try {
    const app = getApps().length
      ? getApp()
      : initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });

            const db = getFirestore(app);
            console.log('🔍 [INVESTIGATION] ✅ Firebase Admin initialized successfully');
            console.log('🔍 [INVESTIGATION] Firebase Admin connected to project:', projectId);
            console.log('🔍 [INVESTIGATION] Firebase Admin collection path: vacationRequests');
            return { app, db, error: null };
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    return { app: null, db: null, error: (error as Error).message };
  }
}