// lib/firebase/index.ts - Unified Firebase service
import { getFirebaseClient } from './client';
import { getFirebaseAdmin, getFirebaseAdminFirestore, getFirebaseAdminAuth } from './admin';

// Client-side Firebase (browser only)
export function getFirebase() {
  if (typeof window === 'undefined') {
    throw new Error('getFirebase() can only be called on the client side');
  }
  return getFirebaseClient();
}

// Server-side Firebase Admin (server only)
export function getFirebaseAdminApp() {
  if (typeof window !== 'undefined') {
    throw new Error('getFirebaseAdminApp() can only be called on the server side');
  }
  return getFirebaseAdmin();
}

export function getFirebaseAdminDb() {
  if (typeof window !== 'undefined') {
    throw new Error('getFirebaseAdminDb() can only be called on the server side');
  }
  return getFirebaseAdminFirestore();
}

export function getFirebaseAdminAuthService() {
  if (typeof window !== 'undefined') {
    throw new Error('getFirebaseAdminAuthService() can only be called on the server side');
  }
  return getFirebaseAdminAuth();
}

// Utility function to check if Firebase is enabled
export function isFirebaseEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true';
}

// Utility function to check if Firebase Admin is available
export function isFirebaseAdminAvailable(): boolean {
  if (typeof window !== 'undefined') return false;
  
  try {
    const required = [
      'FIREBASE_ADMIN_CLIENT_EMAIL',
      'FIREBASE_ADMIN_PRIVATE_KEY', 
      'FIREBASE_PROJECT_ID'
    ];
    return required.every(key => !!process.env[key]);
  } catch {
    return false;
  }
}
