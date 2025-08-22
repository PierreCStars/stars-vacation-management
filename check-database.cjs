#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Checking Firebase Database Content...\n');

// Import Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

async function checkDatabase() {
  try {
    console.log('🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized');
    
    // Check vacation requests collection
    console.log('\n📊 Checking vacation requests...');
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const vacationSnapshot = await getDocs(vacationRequestsRef);
    
    console.log(`📋 Found ${vacationSnapshot.size} vacation requests`);
    
    if (vacationSnapshot.size > 0) {
      console.log('\n📝 Vacation Requests:');
      vacationSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`- ID: ${doc.id}`);
        console.log(`  User: ${data.userName} (${data.userEmail})`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Dates: ${data.startDate} to ${data.endDate}`);
        console.log(`  Company: ${data.company}`);
        console.log(`  Type: ${data.type}`);
        console.log('  ---');
      });
    } else {
      console.log('❌ No vacation requests found in database');
    }
    
    // Check if there are other collections
    console.log('\n🔍 Checking for other collections...');
    const collections = ['users', 'employees', 'vacations', 'requests'];
    
    for (const collectionName of collections) {
      try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);
        if (snapshot.size > 0) {
          console.log(`📁 Collection '${collectionName}': ${snapshot.size} documents`);
        }
      } catch (error) {
        // Collection doesn't exist or can't access
      }
    }
    
    console.log('\n💡 If no data exists, you can:');
    console.log('1. Submit vacation requests through the app');
    console.log('2. Add sample data for testing');
    console.log('3. Check if the collection name is correct');
    
  } catch (error) {
    console.error('\n❌ Error checking database:', error.message);
    if (error.code === 'auth/configuration-not-found') {
      console.log('\n💡 Fix: Enable Anonymous Authentication in Firebase Console');
      console.log('   Go to: Authentication > Sign-in method > Anonymous > Enable');
    }
  }
}

checkDatabase();
