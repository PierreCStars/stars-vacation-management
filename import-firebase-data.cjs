#!/usr/bin/env node

/**
 * Firebase Data Import Script
 * This script imports sample vacation request data into Firebase Firestore
 */

require('dotenv').config();

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

console.log('🚀 Starting Firebase Data Import...\n');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Sample vacation request data
const sampleVacationRequests = [
  {
    userId: 'test.user1@stars.mc',
    userEmail: 'test.user1@stars.mc',
    userName: 'Test User 1',
    startDate: '2025-01-15',
    endDate: '2025-01-17',
    reason: 'Family vacation to the mountains',
    company: 'Stars Yachting',
    type: 'Full day',
    status: 'pending',
    isHalfDay: false,
    halfDayType: null,
    durationDays: 3
  },
  {
    userId: 'test.user2@stars.mc',
    userEmail: 'test.user2@stars.mc',
    userName: 'Test User 2',
    startDate: '2025-01-20',
    endDate: '2025-01-20',
    reason: 'Medical appointment',
    company: 'Stars Real Estate',
    type: 'Half day AM',
    status: 'pending',
    isHalfDay: true,
    halfDayType: 'morning',
    durationDays: 1
  },
  {
    userId: 'test.user3@stars.mc',
    userEmail: 'test.user3@stars.mc',
    userName: 'Test User 3',
    startDate: '2025-01-10',
    endDate: '2025-01-12',
    reason: 'Personal time off',
    company: 'Le Pneu',
    type: 'Full day',
    status: 'approved',
    isHalfDay: false,
    halfDayType: null,
    durationDays: 3,
    reviewedBy: 'Admin User',
    reviewerEmail: 'admin@stars.mc',
    reviewedAt: '2025-01-08T10:00:00Z',
    adminComment: 'Approved - no conflicts detected'
  },
  {
    userId: 'sarah.johnson@stars.mc',
    userEmail: 'sarah.johnson@stars.mc',
    userName: 'Sarah Johnson',
    startDate: '2025-02-01',
    endDate: '2025-02-05',
    reason: 'Ski trip with family',
    company: 'Stars Yachting',
    type: 'Full day',
    status: 'pending',
    isHalfDay: false,
    halfDayType: null,
    durationDays: 5
  },
  {
    userId: 'david.brown@stars.mc',
    userEmail: 'david.brown@stars.mc',
    userName: 'David Brown',
    startDate: '2025-01-25',
    endDate: '2025-01-25',
    reason: 'Half day for personal errands',
    company: 'Stars Real Estate',
    type: 'Half day PM',
    status: 'approved',
    isHalfDay: true,
    halfDayType: 'afternoon',
    durationDays: 1,
    reviewedBy: 'Admin User',
    reviewerEmail: 'admin@stars.mc',
    reviewedAt: '2025-01-20T14:30:00Z',
    adminComment: 'Approved - short duration'
  },
  {
    userId: 'lisa.garcia@stars.mc',
    userEmail: 'lisa.garcia@stars.mc',
    userName: 'Lisa Garcia',
    startDate: '2025-03-10',
    endDate: '2025-03-14',
    reason: 'Spring break vacation',
    company: 'Le Pneu',
    type: 'Full day',
    status: 'pending',
    isHalfDay: false,
    halfDayType: null,
    durationDays: 5
  },
  {
    userId: 'robert.taylor@stars.mc',
    userEmail: 'robert.taylor@stars.mc',
    userName: 'Robert Taylor',
    startDate: '2025-01-30',
    endDate: '2025-01-31',
    reason: 'Conference attendance',
    company: 'Stars Yachting',
    type: 'Full day',
    status: 'rejected',
    isHalfDay: false,
    halfDayType: null,
    durationDays: 2,
    reviewedBy: 'Admin User',
    reviewerEmail: 'admin@stars.mc',
    reviewedAt: '2025-01-25T09:15:00Z',
    adminComment: 'Rejected - conflicts with team project deadline'
  }
];

async function importData() {
  try {
    console.log('🔧 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    console.log('✅ Firebase initialized successfully');

    console.log('\n📊 Importing vacation requests...');
    const vacationRequestsRef = collection(db, 'vacationRequests');
    
    let importedCount = 0;
    let errorCount = 0;

    for (const request of sampleVacationRequests) {
      try {
        const docRef = await addDoc(vacationRequestsRef, {
          ...request,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Imported: ${request.userName} (${request.startDate} to ${request.endDate}) - ID: ${docRef.id}`);
        importedCount++;
      } catch (error) {
        console.error(`❌ Failed to import ${request.userName}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Import Summary:');
    console.log(`✅ Successfully imported: ${importedCount} vacation requests`);
    console.log(`❌ Failed imports: ${errorCount}`);
    console.log(`📊 Total processed: ${sampleVacationRequests.length}`);

    if (importedCount > 0) {
      console.log('\n🎉 Data import completed successfully!');
      console.log('💡 You can now view the data in your Firebase console or through the application.');
    } else {
      console.log('\n⚠️  No data was imported. Please check your Firebase configuration.');
    }

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that all Firebase environment variables are set correctly');
    console.log('2. Verify that your Firebase project is active');
    console.log('3. Ensure Firestore is enabled in your Firebase project');
    console.log('4. Check that your service account has the necessary permissions');
    process.exit(1);
  }
}

// Run the import
importData();
