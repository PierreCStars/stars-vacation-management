/**
 * Backfill script to normalize vacation request status and type fields to canonical values
 * 
 * This script updates all vacation requests in Firestore to use canonical labels:
 * - Status: "Approved" (not "APPROVED" or "approved")
 * - Type: "Paid Vacation" (not "PAID_LEAVE" or "Paid Vacation")
 * 
 * This script is idempotent and safe to run multiple times.
 */

import { getFirebaseAdmin } from '../src/lib/firebaseAdmin';
import { normalizeVacationStatus, normalizeVacationType } from '../src/lib/normalize-vacation-fields';

async function backfillCanonicalVacations() {
  console.log('🔄 Starting backfill of canonical vacation fields...');
  
  const { db, error } = getFirebaseAdmin();
  
  if (error || !db) {
    console.error('❌ Firebase Admin not available:', error);
    process.exit(1);
  }

  try {
    const collection = db.collection('vacationRequests');
    const snapshot = await collection.get();
    
    console.log(`📊 Found ${snapshot.docs.length} vacation requests to process`);
    
    let statusUpdated = 0;
    let typeUpdated = 0;
    let totalUpdated = 0;
    
    const batch = db.batch();
    let batchCount = 0;
    const BATCH_SIZE = 500; // Firestore batch limit
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const updates: any = {};
      let needsUpdate = false;
      
      // Normalize status
      const currentStatus = data.status || 'pending';
      const normalizedStatus = normalizeVacationStatus(currentStatus);
      if (currentStatus !== normalizedStatus) {
        updates.status = normalizedStatus;
        statusUpdated++;
        needsUpdate = true;
      }
      
      // Normalize type
      const currentType = data.type || 'Other';
      const normalizedType = normalizeVacationType(currentType);
      if (currentType !== normalizedType) {
        updates.type = normalizedType;
        typeUpdated++;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        batch.update(doc.ref, updates);
        batchCount++;
        totalUpdated++;
        
        // Commit batch if we've reached the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`✅ Committed batch of ${batchCount} updates`);
          batchCount = 0;
        }
      }
    }
    
    // Commit remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`✅ Committed final batch of ${batchCount} updates`);
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`   Total documents processed: ${snapshot.docs.length}`);
    console.log(`   Status fields updated: ${statusUpdated}`);
    console.log(`   Type fields updated: ${typeUpdated}`);
    console.log(`   Total documents updated: ${totalUpdated}`);
    console.log('\n✅ Backfill completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during backfill:', error);
    process.exit(1);
  }
}

// Run the backfill
backfillCanonicalVacations()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

