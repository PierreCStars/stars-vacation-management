// Test script to verify Firestore connection and data structure
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase-config.js';

async function testFirestoreConnection() {
  console.log('🔍 Testing Firestore connection...');
  
  try {
    // Test 1: Check if we can access the vacation-requests collection
    console.log('\n1. Testing vacation-requests collection access...');
    const vacationRequestsRef = collection(db, 'vacation-requests');
    const snapshot = await getDocs(vacationRequestsRef);
    
    console.log(`✅ Successfully connected to vacation-requests collection`);
    console.log(`📊 Found ${snapshot.size} documents`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 Sample documents:');
      snapshot.forEach((doc, index) => {
        if (index < 3) { // Show first 3 documents
          console.log(`   Document ${doc.id}:`, doc.data());
        }
      });
    } else {
      console.log('⚠️  No documents found in vacation-requests collection');
      console.log('   This might be why no data is showing on the website');
    }
    
    // Test 2: Check for other possible collection names
    console.log('\n2. Checking for alternative collection names...');
    const possibleCollections = [
      'vacationRequests',
      'vacation_requests', 
      'requests',
      'vacation-request',
      'vacations'
    ];
    
    for (const collectionName of possibleCollections) {
      try {
        const testRef = collection(db, collectionName);
        const testSnapshot = await getDocs(testRef);
        if (testSnapshot.size > 0) {
          console.log(`✅ Found ${testSnapshot.size} documents in '${collectionName}' collection`);
        }
      } catch (error) {
        // Collection doesn't exist or no access
      }
    }
    
  } catch (error) {
    console.error('❌ Error connecting to Firestore:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n🔒 Permission denied error detected!');
      console.log('   This means your Firestore security rules are blocking access.');
      console.log('   You need to update your Firestore security rules to allow read access.');
      console.log('\n   Go to Firebase Console > Firestore Database > Rules');
      console.log('   And add this rule for testing:');
      console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
      `);
    } else if (error.code === 'not-found') {
      console.log('\n📁 Collection not found!');
      console.log('   The vacation-requests collection might not exist yet.');
      console.log('   You need to create it in your Firestore database.');
    }
  }
}

// Run the test
testFirestoreConnection().then(() => {
  console.log('\n✅ Firestore test completed');
}).catch((error) => {
  console.error('❌ Test failed:', error);
});
