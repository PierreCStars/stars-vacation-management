// This file is deprecated - use firebaseAdmin.ts instead
// Re-export from the new file for backward compatibility

import { getFirebaseAdmin } from './firebaseAdmin';
export { getFirebaseAdmin };

// Legacy function for backward compatibility
export async function firebaseAdmin() {
  const { getFirebaseAdmin } = await import('./firebaseAdmin');
  const { db, error } = getFirebaseAdmin();
  return { db, error };
}

// Legacy exports for backward compatibility
export function getFirebaseAdminApp() {
  const { app } = getFirebaseAdmin();
  return app;
}

export function getFirebaseAdminFirestore() {
  const { db } = getFirebaseAdmin();
  return db;
}

export function getFirebaseAdminAuth() {
  // Auth is not available in the simplified API
  return null;
}

export function isFirebaseAdminAvailable(): boolean {
  const { error } = getFirebaseAdmin();
  return !error;
}