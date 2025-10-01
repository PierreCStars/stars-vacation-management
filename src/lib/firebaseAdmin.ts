// src/lib/firebaseAdmin.ts
import type { App } from 'firebase-admin/app';
import { getApps, getApp, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function normalizePrivateKey(key?: string) {
  if (!key) return '';
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

export function getFirebaseAdmin(): {
  app: App | null;
  db: FirebaseFirestore.Firestore | null;
  error: string | null;
} {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (!projectId || !clientEmail || !privateKey) {
    return { app: null, db: null, error: 'Missing Firebase Admin envs' };
  }

  const app = getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });

  const db = getFirestore(app);
  return { app, db, error: null };
}