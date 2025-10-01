#!/usr/bin/env node

/**
 * Cleanup Test Users Script
 * 
 * This script removes test users from Firestore collections.
 * Only runs if ENABLE_CLEANUP_TEST_USERS=true is set in environment.
 */

import { getFirebaseAdminFirestore, isFirebaseAdminAvailable } from '../src/lib/firebaseAdmin';

const TEST_USER_NAMES = ['John Smith', 'Mike Wilson', 'Jane Doe'];
const TEST_EMAIL_DOMAINS = ['@example.com', '@test.com', '@mock.com'];

async function cleanupTestUsers() {
  console.log('🧹 Starting test users cleanup...');
  
  // Check if cleanup is enabled
  if (process.env.ENABLE_CLEANUP_TEST_USERS !== 'true') {
    console.log('⚠️  ENABLE_CLEANUP_TEST_USERS not set to true, skipping cleanup');
    return;
  }

  if (!isFirebaseAdminAvailable()) {
    console.error('❌ Firebase Admin not available');
    process.exit(1);
  }

  const db = getFirebaseAdminFirestore();
  let totalDeleted = 0;

  try {
    // Clean up vacationRequests collection
    console.log('🔍 Checking vacationRequests collection...');
    const vacationRequestsRef = db.collection('vacationRequests');
    
    for (const testName of TEST_USER_NAMES) {
      const query = vacationRequestsRef.where('userName', '==', testName);
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        console.log(`🗑️  Found ${snapshot.docs.length} vacation requests for ${testName}`);
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        
        totalDeleted += snapshot.docs.length;
        console.log(`✅ Deleted ${snapshot.docs.length} vacation requests for ${testName}`);
      }
    }

    // Clean up by email domains
    for (const domain of TEST_EMAIL_DOMAINS) {
      const query = vacationRequestsRef.where('userEmail', '>=', domain).where('userEmail', '<', domain + 'z');
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        console.log(`🗑️  Found ${snapshot.docs.length} vacation requests with email domain ${domain}`);
        
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        
        totalDeleted += snapshot.docs.length;
        console.log(`✅ Deleted ${snapshot.docs.length} vacation requests with email domain ${domain}`);
      }
    }

    // Clean up any other collections that might have test data
    const collectionsToCheck = ['users', 'employees', 'testData'];
    
    for (const collectionName of collectionsToCheck) {
      try {
        const collectionRef = db.collection(collectionName);
        const snapshot = await collectionRef.limit(1).get();
        
        if (!snapshot.empty) {
          console.log(`🔍 Checking ${collectionName} collection...`);
          
          for (const testName of TEST_USER_NAMES) {
            const query = collectionRef.where('name', '==', testName);
            const nameSnapshot = await query.get();
            
            if (!nameSnapshot.empty) {
              console.log(`🗑️  Found ${nameSnapshot.docs.length} records in ${collectionName} for ${testName}`);
              
              const batch = db.batch();
              nameSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              
              totalDeleted += nameSnapshot.docs.length;
              console.log(`✅ Deleted ${nameSnapshot.docs.length} records from ${collectionName} for ${testName}`);
            }
          }
        }
      } catch (error) {
        console.log(`⚠️  Could not check ${collectionName} collection:`, error);
      }
    }

    console.log(`🎉 Cleanup completed! Total records deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTestUsers()
    .then(() => {
      console.log('✅ Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

export { cleanupTestUsers };
