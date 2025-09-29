#!/usr/bin/env node

// This script tests Firebase connection once environment variables are set
console.log('🧪 Testing Firebase Connection...\n');

// Load environment variables from .env if it exists
require('dotenv').config();

// Check if Firebase config is available
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('📋 Firebase Configuration:');
console.log(JSON.stringify(firebaseConfig, null, 2));

// Validate configuration
const requiredFields = ['apiKey', 'projectId', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.log('\n❌ Configuration incomplete. Missing:', missingFields);
  process.exit(1);
}

console.log('\n✅ Configuration looks good!');
console.log('💡 Next steps:');
console.log('   1. Set these values in Vercel environment variables');
console.log('   2. Redeploy your application');
console.log('   3. The Firebase errors should disappear');
