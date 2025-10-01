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
    console.error('[FIREBASE_ADMIN] FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  try {
    // Remove single quotes if present
    let keyString = serviceAccountKey;
    if (keyString.startsWith("'")) {
      keyString = keyString.slice(1);
    }
    if (keyString.endsWith("'")) {
      keyString = keyString.slice(0, -1);
    }
    
    // Parse the service account key directly
    const parsed = JSON.parse(keyString);
    
    // Validate required fields
    if (!parsed.project_id) {
      console.error('[FIREBASE_ADMIN] Service account key missing project_id');
      throw new Error('Service account key missing project_id');
    }
    if (!parsed.client_email) {
      console.error('[FIREBASE_ADMIN] Service account key missing client_email');
      throw new Error('Service account key missing client_email');
    }
    if (!parsed.private_key) {
      console.error('[FIREBASE_ADMIN] Service account key missing private_key');
      throw new Error('Service account key missing private_key');
    }
    
    // Normalize private key (replace \n with actual newlines)
    const normalizedPrivateKey = parsed.private_key.replace(/\\n/g, '\n');
    if (!normalizedPrivateKey.includes('\n')) {
      console.warn('[FIREBASE_ADMIN] Private key does not contain newlines - this may cause authentication issues');
    }
    
        // Validate project ID consistency
        const envProjectId = process.env.FIREBASE_PROJECT_ID;
        if (envProjectId && parsed.project_id !== envProjectId) {
          console.error('[FIREBASE_ADMIN] Project ID mismatch:', {
            keyProjectId: parsed.project_id,
            envProjectId: envProjectId
          });
          throw new Error(`Project ID mismatch: key has ${parsed.project_id}, env has ${envProjectId}`);
        }

        // Validate client email format
        const expectedSuffix = `@${parsed.project_id}.iam.gserviceaccount.com`;
        if (!parsed.client_email.endsWith(expectedSuffix)) {
          console.warn('[FIREBASE_ADMIN] Client email does not match expected pattern:', {
            clientEmail: parsed.client_email,
            expectedSuffix: expectedSuffix
          });
        }

        // Validate against separate env vars if they exist
        const envClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        if (envClientEmail && parsed.client_email !== envClientEmail) {
          console.error('[FIREBASE_ADMIN] Client email mismatch:', {
            keyClientEmail: parsed.client_email,
            envClientEmail: envClientEmail
          });
          throw new Error(`Client email mismatch: key has ${parsed.client_email}, env has ${envClientEmail}`);
        }

        console.log('[FIREBASE_ADMIN] Service account key validation passed:', {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKeyLength: normalizedPrivateKey.length,
          hasNewlines: normalizedPrivateKey.includes('\n')
        });

        return {
          ...parsed,
          private_key: normalizedPrivateKey
        };
  } catch (error) {
    console.error('[FIREBASE_ADMIN] Error parsing Firebase service account key:', error);
    console.error('[FIREBASE_ADMIN] Key string (first 100 chars):', serviceAccountKey.substring(0, 100));
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
  }
}

// Alternative function to get service account from separate env vars
function getServiceAccountFromSeparateEnvs(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  
  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }
  
  // Normalize private key
  const normalizedPrivateKey = privateKey.replace(/\\n/g, '\n');
  
  console.log('[FIREBASE_ADMIN] Using separate environment variables:', {
    projectId,
    clientEmail,
    privateKeyLength: normalizedPrivateKey.length,
    hasNewlines: normalizedPrivateKey.includes('\n')
  });
  
  return {
    projectId: projectId,
    privateKey: normalizedPrivateKey,
    clientEmail: clientEmail
  };
}

// Initialize Firebase Admin
let adminApp: any = null;

export function getFirebaseAdminApp() {
  if (!adminApp) {
    if (getApps().length === 0) {
      try {
        console.log('[FIREBASE_ADMIN] Initializing Firebase Admin...');
        
        // Try to get service account from combined key first, then separate env vars
        let serviceAccount: ServiceAccount;
        try {
          serviceAccount = getServiceAccount();
          console.log('[FIREBASE_ADMIN] Using FIREBASE_SERVICE_ACCOUNT_KEY');
        } catch (keyError) {
          console.log('[FIREBASE_ADMIN] FIREBASE_SERVICE_ACCOUNT_KEY failed, trying separate env vars...');
          const separateAccount = getServiceAccountFromSeparateEnvs();
          if (!separateAccount) {
            throw new Error('No valid Firebase service account configuration found. Need either FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID + FIREBASE_ADMIN_CLIENT_EMAIL + FIREBASE_ADMIN_PRIVATE_KEY');
          }
          serviceAccount = separateAccount;
          console.log('[FIREBASE_ADMIN] Using separate environment variables');
        }
        
            adminApp = initializeApp({
              credential: cert(serviceAccount),
              projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.projectId,
            });
        
        console.log('[FIREBASE_ADMIN] ✅ Firebase Admin initialized successfully');
        console.log('[FIREBASE_ADMIN] 📊 Project ID:', adminApp.options.projectId);
        console.log('[FIREBASE_ADMIN] 📧 Client Email:', serviceAccount.clientEmail);
      } catch (error) {
        console.error('[FIREBASE_ADMIN] ❌ Failed to initialize Firebase Admin:', error);
        throw error;
      }
    } else {
      adminApp = getApps()[0];
      console.log('[FIREBASE_ADMIN] Using existing Firebase Admin app');
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

