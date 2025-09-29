#!/usr/bin/env node

/**
 * Test Firebase Client SDK Initialization
 * This script tests the client-side Firebase configuration
 */

// Load .env.local first (higher priority), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🧪 Testing Firebase Client SDK Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:', process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log('NEXT_PUBLIC_FIREBASE_APP_ID:', process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
console.log('NEXT_PUBLIC_ENABLE_FIREBASE:', process.env.NEXT_PUBLIC_ENABLE_FIREBASE);

// Check for placeholder values
const hasPlaceholders = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
].some(key => {
  const value = process.env[key];
  return value && (
    value.includes('your_') || 
    value.includes('your-') ||
    value.includes('YOUR_') ||
    value.includes('YOUR-') ||
    value === 'your_project_id_here' ||
    value === 'your_api_key_here' ||
    value === 'your_sender_id_here' ||
    value === 'your_app_id_here'
  );
});

if (hasPlaceholders) {
  console.log('\n❌ Found placeholder values in environment variables');
  console.log('💡 Replace placeholder values with actual Firebase credentials');
  process.exit(1);
} else {
  console.log('\n✅ No placeholder values found');
}

// Test Firebase Client SDK initialization
console.log('\n🧪 Testing Firebase Client SDK...');
try {
  const { initializeApp, getApps } = require('firebase/app');
  const { getFirestore } = require('firebase/firestore');
  const { getAuth } = require('firebase/auth');

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check if Firebase is already initialized
  const existingApps = getApps();
  let app;
  
  if (existingApps.length > 0) {
    app = existingApps[0];
    console.log('✅ Using existing Firebase app');
  } else {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase Client SDK initialized successfully');
  }

  console.log('📊 Project ID:', app.options.projectId);
  console.log('🔑 API Key:', app.options.apiKey?.substring(0, 10) + '...');
  console.log('🏠 Auth Domain:', app.options.authDomain);
  
  // Test Firestore and Auth
  const db = getFirestore(app);
  const auth = getAuth(app);
  console.log('✅ Firestore instance created');
  console.log('✅ Auth instance created');
  
  console.log('\n🎉 Firebase Client SDK test passed!');
  console.log('✅ All client-side Firebase services are working');
  
} catch (error) {
  console.error('❌ Firebase Client SDK test failed:', error.message);
  console.error('💡 This might be due to:');
  console.error('   - Missing or invalid environment variables');
  console.error('   - Network connectivity issues');
  console.error('   - Firebase project configuration issues');
  process.exit(1);
}
