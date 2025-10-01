#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing Firebase Admin availability...\n');

// Check environment variables
console.log('Environment variables:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? '✅ Set' : '❌ Missing');
console.log('FIREBASE_SERVICE_ACCOUNT_KEY:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing');

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    // Remove single quotes if present
    let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (keyString.startsWith("'") && keyString.endsWith("'")) {
      keyString = keyString.slice(1, -1);
    }
    const serviceAccount = JSON.parse(keyString);
    console.log('Service account details:');
    console.log('- Project ID:', serviceAccount.project_id);
    console.log('- Client Email:', serviceAccount.client_email);
    console.log('- Private Key ID:', serviceAccount.private_key_id);
    console.log('- Type:', serviceAccount.type);
  } catch (error) {
    console.error('❌ Error parsing service account key:', error.message);
  }
}

// Test Firebase Admin initialization
try {
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const { getFirestore } = require('firebase-admin/firestore');
  
  // Remove single quotes if present
  let keyString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (keyString.startsWith("'")) {
    keyString = keyString.slice(1);
  }
  if (keyString.endsWith("'")) {
    keyString = keyString.slice(0, -1);
  }
  console.log('Key string length after quote removal:', keyString.length);
  console.log('First 50 chars after quote removal:', keyString.substring(0, 50));
  const serviceAccount = JSON.parse(keyString);
  
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({ 
        credential: cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'stars-vacation-management'
      });
  
  const db = getFirestore(app);
  console.log('\n✅ Firebase Admin initialized successfully!');
  console.log('📊 Project ID:', app.options.projectId);
  
  // Test Firestore connection
  console.log('\n🔍 Testing Firestore connection...');
  db.collection('test').limit(1).get()
    .then(() => {
      console.log('✅ Firestore connection successful!');
    })
    .catch((error) => {
      console.error('❌ Firestore connection failed:', error.message);
    });
    
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  console.error('Stack:', error.stack);
}
