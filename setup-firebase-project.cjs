#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Firebase Project Setup Guide');
console.log('===============================\n');

console.log('❌ ISSUE DETECTED: Firebase project configuration not found');
console.log('The error "auth/configuration-not-found" indicates that:');
console.log('1. The Firebase project "stars-vacation-management" may not exist');
console.log('2. No web app is configured in the project');
console.log('3. Environment variables contain placeholder values\n');

console.log('🔧 SOLUTION: Set up Firebase project properly\n');

console.log('📋 Step 1: Create/Verify Firebase Project');
console.log('1. Go to https://console.firebase.google.com/');
console.log('2. Click "Create a project" or select existing project');
console.log('3. Project ID should be: stars-vacation-management');
console.log('4. Enable Google Analytics (optional)\n');

console.log('📋 Step 2: Add Web App to Firebase Project');
console.log('1. In your Firebase project dashboard');
console.log('2. Click the web icon (</>) to add a web app');
console.log('3. Register app with nickname: "stars-vacation-management-web"');
console.log('4. Copy the configuration object\n');

console.log('📋 Step 3: Update Environment Variables');
console.log('You need to update these values in your .env file:\n');

// Check current .env values
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const firebaseVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];
  
  console.log('Current Firebase configuration:');
  firebaseVars.forEach(varName => {
    const line = envContent.split('\n').find(line => line.startsWith(varName));
    if (line) {
      if (line.includes('your-') || line.includes('placeholder')) {
        console.log(`   ❌ ${varName}: ${line.split('=')[1]}`);
      } else {
        console.log(`   ✅ ${varName}: Set`);
      }
    } else {
      console.log(`   ❌ ${varName}: Missing`);
    }
  });
}

console.log('\n📋 Step 4: Example Configuration');
console.log('After adding the web app, your .env should look like:');
console.log(`
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC1234567890abcdefghijklmnopqrstuvwxyz
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
`);

console.log('\n📋 Step 5: Enable Authentication');
console.log('1. In Firebase Console, go to Authentication');
console.log('2. Click "Get started"');
console.log('3. Go to "Sign-in method" tab');
console.log('4. Enable "Anonymous" authentication');
console.log('5. Save the changes\n');

console.log('📋 Step 6: Test the Fix');
console.log('After updating the .env file:');
console.log('1. Restart your development server: npm run dev');
console.log('2. Check browser console for Firebase auth errors');
console.log('3. Test API endpoints with authentication\n');

console.log('🚨 CRITICAL: The Firebase project must exist and have a web app configured');
console.log('The "auth/configuration-not-found" error will persist until this is fixed.'); 