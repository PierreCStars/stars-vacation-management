#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

console.log('🔍 Testing Firebase Configuration...\n');

// Check environment variables
const requiredVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID', 
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

const optionalVars = [
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📋 Optional Environment Variables:');
optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (will use defaults)`);
  }
});

console.log('\n🔧 Firebase Configuration:');
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log(JSON.stringify(firebaseConfig, null, 2));

// Check for missing required fields
const missingFields = requiredVars.filter(varName => !process.env[varName]);

if (missingFields.length > 0) {
  console.log('\n❌ MISSING REQUIRED FIELDS:');
  missingFields.forEach(field => console.log(`   - ${field}`));
  console.log('\n💡 To fix this:');
  console.log('   1. Go to Firebase Console > Project Settings > General');
  console.log('   2. Scroll to "Your apps" section');
  console.log('   3. Copy the actual values to your Vercel environment variables');
  console.log('   4. Redeploy your application');
} else {
  console.log('\n✅ All required Firebase configuration fields are present!');
}

console.log('\n🌐 Current Environment:', process.env.NODE_ENV || 'development');
console.log('📁 Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET');
