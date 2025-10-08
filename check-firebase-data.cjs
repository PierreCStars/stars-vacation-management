#!/usr/bin/env node

/**
 * Script to check Firebase database and populate with test data if empty
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

async function checkFirebaseData() {
  try {
    console.log('🔍 Checking Firebase database...');
    
    // Load Firebase credentials
    const keyData = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'));
    
    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(keyData),
      projectId: keyData.project_id
    });
    
    const db = getFirestore(app);
    
    // Check if vacationRequests collection exists and has data
    const snapshot = await db.collection('vacationRequests').get();
    console.log(`📊 Found ${snapshot.docs.length} vacation requests in Firebase`);
    
    if (snapshot.docs.length === 0) {
      console.log('📝 Firebase database is empty, adding test data...');
      
      // Add some test data
      const testData = [
        {
          userId: 'user-1',
          userEmail: 'pierre@stars.mc',
          userName: 'Pierre Corbucci',
          company: 'STARS_MC',
          type: 'VACATION',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          status: 'pending',
          reason: 'Family vacation',
          createdAt: new Date().toISOString(),
          durationDays: 3
        },
        {
          userId: 'user-2',
          userEmail: 'daniel@stars.mc',
          userName: 'Daniel Smith',
          company: 'STARS_MC',
          type: 'VACATION',
          startDate: '2025-01-20',
          endDate: '2025-01-22',
          status: 'approved',
          reason: 'Personal time off',
          createdAt: new Date().toISOString(),
          durationDays: 3,
          reviewedAt: new Date().toISOString(),
          reviewedBy: {
            name: 'Admin',
            email: 'admin@stars.mc'
          }
        },
        {
          userId: 'user-3',
          userEmail: 'johnny@stars.mc',
          userName: 'Johnny Doe',
          company: 'STARS_MC',
          type: 'SICK_LEAVE',
          startDate: '2025-01-25',
          endDate: '2025-01-25',
          status: 'denied',
          reason: 'Medical appointment',
          createdAt: new Date().toISOString(),
          durationDays: 1,
          reviewedAt: new Date().toISOString(),
          reviewedBy: {
            name: 'Admin',
            email: 'admin@stars.mc'
          }
        }
      ];
      
      // Add test data to Firebase
      for (const data of testData) {
        const docRef = await db.collection('vacationRequests').add(data);
        console.log(`✅ Added test request: ${data.userName} (${docRef.id})`);
      }
      
      console.log('🎉 Test data added to Firebase successfully!');
    } else {
      console.log('📋 Existing data in Firebase:');
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.userName} (${data.status}) - ${doc.id}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Firebase:', error);
    process.exit(1);
  }
}

checkFirebaseData();
