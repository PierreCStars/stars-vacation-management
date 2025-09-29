// Firebase Admin SDK - Server-side only
// This file should NEVER be imported by client components

import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('firebaseAdmin.ts should only be used server-side');
}

// Parse service account key with proper newline handling
function getServiceAccount(): ServiceAccount {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  try {
    // Parse the service account key directly
    return JSON.parse(serviceAccountKey);
  } catch (error) {
    console.error('Error parsing Firebase service account key:', error);
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
  }
}

// Initialize Firebase Admin
let adminApp: any = null;

export function getFirebaseAdminApp() {
  if (!adminApp) {
    if (getApps().length === 0) {
      try {
        const serviceAccount = getServiceAccount();
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || 'stars-vacation-management',
        });
        
        console.log('✅ Firebase Admin initialized successfully');
        console.log('📊 Firebase Admin projectId:', adminApp.options.projectId);
      } catch (error) {
        console.error('❌ Failed to initialize Firebase Admin:', error);
        throw error;
      }
    } else {
      adminApp = getApps()[0];
    }
  }
  
  return adminApp;
}

// Get Firestore instance
export function getFirebaseAdminFirestore() {
  const app = getFirebaseAdminApp();
  return getFirestore(app);
}

// Get Auth instance
export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  return getAuth(app);
}

// Check if Firebase Admin is available
export function isFirebaseAdminAvailable(): boolean {
  try {
    getFirebaseAdminApp();
    return true;
  } catch (error) {
    return false;
  }
}

// Export types for server-side usage
export type { ServiceAccount };

