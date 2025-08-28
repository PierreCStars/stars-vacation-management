import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let firebaseAdminInitialized = false;

// Check if Firebase Admin is already initialized
if (!getApps().length) {
  try {
    // Check if required environment variables are set
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      // Initialize Firebase Admin with service account credentials
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
      firebaseAdminInitialized = true;
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.log('⚠️  Firebase Admin environment variables not set - using mock data');
      console.log('   Required: FIREBASE_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    console.log('⚠️  Continuing without Firebase Admin - using mock data');
  }
}

export function firebaseAdmin() {
  if (!firebaseAdminInitialized) {
    throw new Error('Firebase Admin not available - environment variables not configured');
  }
  
  try {
    const db = getFirestore();
    return { db };
  } catch (error) {
    console.error('❌ Failed to get Firestore instance:', error);
    throw new Error('Firebase Admin not available');
  }
}

export function isFirebaseAdminAvailable() {
  return firebaseAdminInitialized;
}
