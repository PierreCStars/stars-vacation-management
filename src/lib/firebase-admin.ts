// This file is deprecated - use firebaseAdmin.ts instead
// Re-export from the new file for backward compatibility

export { 
  getFirebaseAdminApp,
  getFirebaseAdminFirestore,
  getFirebaseAdminAuth,
  isFirebaseAdminAvailable
} from './firebaseAdmin';

// Legacy function for backward compatibility
export function firebaseAdmin() {
  const { getFirebaseAdminFirestore } = require('./firebaseAdmin');
  return { db: getFirebaseAdminFirestore() };
}