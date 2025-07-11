#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Firebase Configuration...\n');

const envPath = path.join(process.cwd(), '.env');
let envContent = '';

try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (error) {
  console.log('❌ .env file not found');
  process.exit(1);
}

// Check for placeholder Firebase values
const placeholderPatterns = [
  /your-api-key-here/,
  /your-messaging-sender-id-here/,
  /your-app-id-here/
];

let hasPlaceholders = false;

placeholderPatterns.forEach(pattern => {
  if (pattern.test(envContent)) {
    hasPlaceholders = true;
  }
});

if (hasPlaceholders) {
  console.log('⚠️  Found placeholder Firebase configuration values in .env file');
  console.log('\n📋 To fix this, you need to:');
  console.log('\n1. Go to your Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project: stars-vacation-management');
  console.log('3. Go to Project Settings (gear icon)');
  console.log('4. Scroll down to "Your apps" section');
  console.log('5. Find your web app or create a new one');
  console.log('6. Copy the configuration values:');
  console.log('   - apiKey');
  console.log('   - messagingSenderId');
  console.log('   - appId');
  console.log('\n7. Replace the placeholder values in your .env file:');
  console.log('   - your-api-key-here → your actual API key');
  console.log('   - your-messaging-sender-id-here → your actual messaging sender ID');
  console.log('   - your-app-id-here → your actual app ID');
  console.log('\n8. Restart your development server');
} else {
  console.log('✅ Firebase configuration looks good!');
}

console.log('\n🔍 Current Firebase configuration:');
const firebaseLines = envContent.split('\n').filter(line => line.includes('FIREBASE'));
firebaseLines.forEach(line => {
  if (line.includes('your-')) {
    console.log(`   ⚠️  ${line.trim()}`);
  } else {
    console.log(`   ✅ ${line.trim()}`);
  }
});

console.log('\n📧 Email configuration status:');
const emailLines = envContent.split('\n').filter(line => 
  line.includes('SMTP') || line.includes('GMAIL') || line.includes('RESEND')
);
if (emailLines.length > 0) {
  emailLines.forEach(line => {
    console.log(`   ✅ ${line.trim()}`);
  });
} else {
  console.log('   ⚠️  No email configuration found');
}

console.log('\n🔐 NextAuth configuration status:');
const authLines = envContent.split('\n').filter(line => 
  line.includes('NEXTAUTH') || line.includes('GOOGLE_ID') || line.includes('GOOGLE_SECRET')
);
authLines.forEach(line => {
  if (line.includes('your-') || line.includes('fallback')) {
    console.log(`   ⚠️  ${line.trim()}`);
  } else {
    console.log(`   ✅ ${line.trim()}`);
  }
}); 