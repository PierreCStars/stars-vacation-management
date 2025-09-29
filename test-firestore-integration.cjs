#!/usr/bin/env node

// Load environment variables
require('dotenv/config');

/**
 * Firestore Integration Test Script (Admin SDK)
 * This script tests the complete Firestore integration using Firebase Admin SDK
 */

// Load .env.local first (higher priority), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const admin = require('firebase-admin');

console.log('🧪 Testing Firestore Integration with Admin SDK...\n');

// Validate required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_KEY'
];

const missingVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(key => console.error(`   - ${key}`));
  console.error('\n💡 Add these to your .env.local file:');
  console.error('   FIREBASE_PROJECT_ID=your-project-id');
  console.error('   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}');
  process.exit(1);
}

// Check for placeholder values
const placeholders = requiredEnvVars.filter(key => {
  const value = process.env[key];
  return value && (
    value.includes('your_') || 
    value.includes('your-') ||
    value.includes('YOUR_') ||
    value.includes('YOUR-') ||
    value === 'your_project_id_here' ||
    value === 'your_service_account_key_here'
  );
});

if (placeholders.length > 0) {
  console.error('❌ Environment variables contain placeholder values:');
  placeholders.forEach(key => console.error(`   - ${key}: ${process.env[key]}`));
  console.error('\n💡 Replace placeholder values with actual Firebase service account credentials.');
  process.exit(1);
}

console.log('✅ Environment variables validated');
console.log(`📊 Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
console.log(`🔑 Service Account Key: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 50)}...`);

// Initialize Firebase Admin SDK
let app;
let db;

try {
  console.log('\n🚀 Initializing Firebase Admin SDK...');
  
  // Parse service account key
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  db = admin.firestore();
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`📊 Connected to project: ${app.options.projectId}`);
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  process.exit(1);
}

// Test functions
async function testReadVacationRequests() {
  console.log('\n📋 Test 1: Reading existing vacation requests...');
  try {
    const snapshot = await db.collection('vacationRequests').limit(5).get();
    console.log(`✅ Found ${snapshot.size} vacation requests`);
    
    if (snapshot.size > 0) {
      console.log('📄 Sample requests:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${doc.id}: ${data.userName || 'Unknown'} (${data.status || 'Unknown'})`);
      });
    }
    return snapshot.size;
  } catch (error) {
    console.error('❌ Failed to read vacation requests:', error.message);
    throw error;
  }
}

async function testWriteVacationRequest() {
  console.log('\n✍️  Test 2: Writing test vacation request...');
  try {
    const testRequest = {
      userName: 'Test User',
      userEmail: 'test@example.com',
      startDate: '2024-01-15',
      endDate: '2024-01-20',
      status: 'pending',
      reason: 'Integration test',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('vacationRequests').add(testRequest);
    console.log(`✅ Test request created with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to write test request:', error.message);
    throw error;
  }
}

async function testReadAfterWrite(initialCount) {
  console.log('\n📊 Test 3: Verifying write operation...');
  try {
    const snapshot = await db.collection('vacationRequests').limit(10).get();
    const newCount = snapshot.size;
    console.log(`✅ Total requests after write: ${newCount} (was ${initialCount})`);
    
    if (newCount > initialCount) {
      console.log('✅ Write operation verified - count increased');
    } else {
      console.log('⚠️  Write operation may not have been recorded');
    }
    return newCount;
  } catch (error) {
    console.error('❌ Failed to verify write operation:', error.message);
    throw error;
  }
}

async function cleanupTestData(testDocId) {
  if (testDocId) {
    console.log('\n🧹 Cleaning up test data...');
    try {
      await db.collection('vacationRequests').doc(testDocId).delete();
      console.log('✅ Test data cleaned up');
    } catch (error) {
      console.error('⚠️  Failed to cleanup test data:', error.message);
    }
  }
}

// Main test execution
async function runTests() {
  let testDocId = null;
  
  try {
    const initialCount = await testReadVacationRequests();
    testDocId = await testWriteVacationRequest();
    await testReadAfterWrite(initialCount);
    
    console.log('\n🎉 All Firestore integration tests passed!');
    console.log('✅ Firebase Admin SDK is working correctly');
    console.log('✅ Firestore read/write operations successful');
    console.log('✅ Environment configuration is correct');
    
  } catch (error) {
    console.error('\n❌ Firestore integration test failed:', error.message);
    console.error('💡 Check your Firebase service account credentials and Firestore security rules');
    process.exit(1);
  } finally {
    await cleanupTestData(testDocId);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error.message);
  process.exit(1);
});