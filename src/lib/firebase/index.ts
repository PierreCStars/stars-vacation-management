// lib/firebase/index.ts - Unified Firebase service
import { getFirebaseClient } from './client';
import { getFirebaseAdmin } from './admin';

// Client-side Firebase (browser only)
export function getFirebase() {
  if (typeof window === 'undefined') {
    throw new Error('getFirebase() can only be called on the client side');
  }
  return getFirebaseClient();
}

// Server-side Firebase Admin (server only)
export { getFirebaseAdmin } from './admin';

export function isFirebaseAdminAvailable() {
  const { error } = getFirebaseAdmin();
  return !error;
}

export function getFirebaseAdminDb() {
  const { db } = getFirebaseAdmin();
  return db;
}

// Utility function to check if Firebase is enabled
export function isFirebaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true';
}
