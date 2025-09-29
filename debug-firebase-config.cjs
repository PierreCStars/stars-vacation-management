#!/usr/bin/env node

// Load environment variables
require('dotenv/config');

/**
 * Debug Firebase Configuration
 * This script helps debug Firebase configuration issues
 */

// Load .env.local first (higher priority), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔍 Debugging Firebase Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('NEXT_PUBLIC_FIREBASE_API_KEY:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...');
console.log('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('NEXT_PUBLIC_ENABLE_FIREBASE:', process.env.NEXT_PUBLIC_ENABLE_FIREBASE);
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY:', process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20) + '...');

// Check for placeholder values
const hasPlaceholders = [
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY'
].some(key => {
  const value = process.env[key];
  return value && (
    value.includes('your_') || 
    value.includes('your-') ||
    value.includes('YOUR_') ||
    value.includes('YOUR-') ||
    value === 'your_project_id_here' ||
    value === 'your_api_key_here' ||
    value === 'your_client_email_here' ||
    value === 'your_private_key_here'
  );
});

if (hasPlaceholders) {
  console.log('\n❌ Found placeholder values in environment variables');
  console.log('💡 Replace placeholder values with actual Firebase credentials');
} else {
  console.log('\n✅ No placeholder values found');
}

// Test Firebase Admin SDK initialization
console.log('\n🧪 Testing Firebase Admin SDK...');
try {
  const admin = require('firebase-admin');
  
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey
    };

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log('📊 Project ID:', app.options.projectId);
    
    // Test Firestore connection
    const db = admin.firestore();
    console.log('✅ Firestore instance created');
    
    // Test a simple read operation
    console.log('🧪 Testing Firestore read operation...');
    db.collection('vacationRequests').limit(1).get()
      .then(snapshot => {
        console.log('✅ Firestore read successful');
        console.log('📄 Found', snapshot.size, 'documents');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Firestore read failed:', error.message);
        console.error('💡 This might be due to:');
        console.error('   - Firestore security rules not deployed');
        console.error('   - Incorrect project ID');
        console.error('   - Invalid service account credentials');
        process.exit(1);
      });
      
  } else {
    console.log('❌ Missing required Admin SDK environment variables');
    console.log('💡 Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK test failed:', error.message);
  process.exit(1);
}
