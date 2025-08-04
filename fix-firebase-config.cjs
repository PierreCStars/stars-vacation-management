#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Firebase Configuration Fix Script');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

// Read current .env file
const envContent = fs.readFileSync(envPath, 'utf8');

// Check for placeholder values
const placeholderChecks = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', placeholder: 'your-api-key-here' },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', placeholder: 'your-messaging-sender-id-here' },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', placeholder: 'your-app-id-here' }
];

console.log('🔍 Checking for placeholder values...\n');

let hasPlaceholders = false;
placeholderChecks.forEach(({ key, placeholder }) => {
  if (envContent.includes(`${key}=${placeholder}`)) {
    console.log(`❌ Found placeholder: ${key}=${placeholder}`);
    hasPlaceholders = true;
  } else {
    console.log(`✅ ${key} appears to be set`);
  }
});

if (hasPlaceholders) {
  console.log('\n⚠️  ACTION REQUIRED:');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: stars-vacation-management');
  console.log('3. Go to Project Settings > General');
  console.log('4. Scroll to "Your apps" section');
  console.log('5. Copy the real values for:');
  console.log('   - apiKey');
  console.log('   - messagingSenderId');
  console.log('   - appId');
  console.log('6. Update your .env file with these values');
  console.log('\nExample:');
  console.log('NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC...');
  console.log('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789');
  console.log('NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef');
} else {
  console.log('\n✅ All Firebase configuration appears to be set correctly!');
}

console.log('\n📋 Next Steps:');
console.log('1. Update your .env file with real Firebase values');
console.log('2. Deploy updated Firestore rules: firebase deploy --only firestore:rules');
console.log('3. Test the application: npm run dev');
console.log('4. Check API endpoints: curl http://localhost:3000/api/vacation-requests'); 