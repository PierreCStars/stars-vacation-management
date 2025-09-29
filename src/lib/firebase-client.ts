/**
 * Firebase Client-Side Initialization
 * This file handles Firebase initialization specifically for client-side usage
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration - only use client-side environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if all required environment variables are present
const isConfigValid = () => {
  // Check if Firebase is enabled first
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
    return false;
  }
  
  // Check if all config values are present and valid
  const hasValidConfig = !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    firebaseConfig.apiKey !== '' &&
    firebaseConfig.authDomain !== '' &&
    firebaseConfig.projectId !== '' &&
    firebaseConfig.storageBucket !== '' &&
    firebaseConfig.messagingSenderId !== '' &&
    firebaseConfig.appId !== ''
  );
  
  if (!hasValidConfig) {
    const missing = [];
    if (!firebaseConfig.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
    if (!firebaseConfig.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
    if (!firebaseConfig.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
    if (!firebaseConfig.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
    if (!firebaseConfig.messagingSenderId) missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
    if (!firebaseConfig.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing required Firebase environment variables:', missing.join(', '));
    }
    return false;
  }
  
  return true;
};

// Initialize Firebase only on client-side
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let initialized = false;

// Lazy initialization function with retry mechanism
const initializeFirebase = (retryCount = 0) => {
  if (initialized || typeof window === 'undefined') {
    return { app, db, auth };
  }

  try {
    // Check if Firebase is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
      console.log('ℹ️ Firebase disabled - set NEXT_PUBLIC_ENABLE_FIREBASE=true and configure Firebase env vars to enable');
      // Set empty values but don't throw
      app = undefined;
      db = undefined;
      auth = undefined;
      initialized = true;
      return { app, db, auth };
    }

    // Check if config is valid (warns instead of throwing)
    const configValid = isConfigValid();
    
    if (!configValid) {
      // If this is the first attempt and we're in development, retry after a short delay
      if (retryCount === 0 && process.env.NODE_ENV === 'development') {
        console.log('🔄 Retrying Firebase initialization in 100ms...');
        setTimeout(() => initializeFirebase(1), 100);
        return { app: undefined, db: undefined, auth: undefined };
      }
      
      // Only warn after retry fails
      if (retryCount > 0) {
        console.warn('⚠️ Firebase configuration invalid after retry - Firebase will be disabled');
      }
      app = undefined;
      db = undefined;
      auth = undefined;
      initialized = true;
      return { app, db, auth };
    }

    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Using existing Firebase app (client)');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully (client)');
    }
    
    // Validate projectId after initialization
    const projectId = app.options.projectId;
    console.log('[firebase] projectId =', projectId);
    
    if (!projectId || projectId === 'your_project_id_here') {
      console.warn(`⚠️ Invalid Firebase projectId: "${projectId}". Check your environment variables.`);
      app = undefined;
      db = undefined;
      auth = undefined;
    } else {
      db = getFirestore(app);
      auth = getAuth(app);
      console.log(`📊 Firebase projectId (client): ${projectId}`);
      
      // Anonymous auth for development only (moved to separate function to avoid top-level await)
      if (process.env.NODE_ENV === 'development') {
        // Initialize auth asynchronously after Firebase is set up
        setTimeout(async () => {
          try {
            const { signInAnonymously } = await import('firebase/auth');
            if (auth) {
              const user = auth.currentUser;
              if (!user) {
                console.log('🔐 Signing in anonymously for development...');
                await signInAnonymously(auth);
                console.log('✅ Anonymous authentication successful');
              } else {
                console.log('✅ User already authenticated:', user.uid);
              }
            }
          } catch (authError) {
            console.warn('⚠️ Anonymous authentication failed:', authError);
          }
        }, 100);
      }
    }
    
    initialized = true;
  } catch (error) {
    console.error('❌ Firebase client initialization failed:', error);
    // Set empty values on error
    app = undefined;
    db = undefined;
    auth = undefined;
    initialized = true;
  }

  return { app, db, auth };
};

// Initialize on client-side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

// Export Firebase instances
export { app, db, auth };

// Helper functions
export function getFirebaseApp(): FirebaseApp {
  const { app: currentApp } = initializeFirebase();
  if (!currentApp) {
    throw new Error('Firebase not initialized on client-side. Make sure Firebase is properly configured.');
  }
  return currentApp;
}

export function getFirestoreInstance(): Firestore {
  const { db: currentDb } = initializeFirebase();
  if (!currentDb) {
    throw new Error('Firestore not initialized on client-side. Make sure Firebase is properly configured.');
  }
  return currentDb;
}

export function getAuthInstance(): Auth {
  const { auth: currentAuth } = initializeFirebase();
  if (!currentAuth) {
    throw new Error('Auth not initialized on client-side. Make sure Firebase is properly configured.');
  }
  return currentAuth;
}

export function isFirebaseAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  const { app: currentApp, db: currentDb, auth: currentAuth } = initializeFirebase();
  return !!(currentApp && currentDb && currentAuth);
}
