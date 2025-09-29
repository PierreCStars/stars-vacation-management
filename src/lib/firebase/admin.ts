// lib/firebase/admin.ts
import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error('firebase/admin.ts should only be used server-side');
}

function getServiceAccount(): ServiceAccount {
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  
  if (!clientEmail || !privateKey || !projectId) {
    throw new Error('Missing Firebase Admin environment variables: FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_PROJECT_ID');
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

let adminApp: any = null;

export function getFirebaseAdmin() {
  if (!adminApp) {
    if (getApps().length === 0) {
      try {
        const serviceAccount = getServiceAccount();
        
        adminApp = initializeApp({
          credential: cert(serviceAccount),
          projectId: serviceAccount.projectId,
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

export function getFirebaseAdminFirestore() {
  const app = getFirebaseAdmin();
  return getFirestore(app);
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdmin();
  return getAuth(app);
}
