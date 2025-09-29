#!/usr/bin/env node

/**
 * Environment Check Script (CommonJS)
 * Validates that all required environment variables are set for both client and server
 */

// Load .env.local first (higher priority), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const clientRequired = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

const adminRequired = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL", 
  "FIREBASE_PRIVATE_KEY"
];

console.log('🔍 Checking Firebase environment variables...\n');

let hasErrors = false;
let hasWarnings = false;

// Check for missing client variables
const missingClient = clientRequired.filter(key => !process.env[key]);
if (missingClient.length > 0) {
  console.error('❌ Missing required client environment variables:');
  missingClient.forEach(key => console.error(`   - ${key}`));
  hasErrors = true;
}

// Check for missing admin variables
const missingAdmin = adminRequired.filter(key => !process.env[key]);
if (missingAdmin.length > 0) {
  console.error('❌ Missing required admin environment variables:');
  missingAdmin.forEach(key => console.error(`   - ${key}`));
  hasErrors = true;
}

// Check for placeholder values in client vars
const clientPlaceholders = clientRequired.filter(key => {
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

if (clientPlaceholders.length > 0) {
  console.error('❌ Client environment variables contain placeholder values:');
  clientPlaceholders.forEach(key => console.error(`   - ${key}: ${process.env[key]}`));
  hasErrors = true;
}

// Check for placeholder values in admin vars
const adminPlaceholders = adminRequired.filter(key => {
  const value = process.env[key];
  return value && (
    value.includes('your_') || 
    value.includes('your-') ||
    value.includes('YOUR_') ||
    value.includes('YOUR-') ||
    value === 'your_project_id_here' ||
    value === 'your_client_email_here' ||
    value === 'your_private_key_here'
  );
});

if (adminPlaceholders.length > 0) {
  console.error('❌ Admin environment variables contain placeholder values:');
  adminPlaceholders.forEach(key => console.error(`   - ${key}: ${process.env[key]}`));
  hasErrors = true;
}

// Check if Firebase is enabled
if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
  console.warn('⚠️  NEXT_PUBLIC_ENABLE_FIREBASE is not set to "true"');
  console.warn('   Firebase will be disabled. Set NEXT_PUBLIC_ENABLE_FIREBASE=true to enable.');
  hasWarnings = true;
}

// Check project ID consistency
const clientProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const adminProjectId = process.env.FIREBASE_PROJECT_ID;
if (clientProjectId && adminProjectId && clientProjectId !== adminProjectId) {
  console.warn('⚠️  Project ID mismatch between client and admin:');
  console.warn(`   Client: ${clientProjectId}`);
  console.warn(`   Admin:  ${adminProjectId}`);
  hasWarnings = true;
}

if (hasErrors) {
  console.log('\n💡 To fix this:');
  console.log('1. Go to https://console.firebase.google.com/project/stars-vacation-management/settings/general');
  console.log('2. Scroll down to "Your apps" section and copy the configuration');
  console.log('3. Update your .env.local file with the real values');
  console.log('4. For Admin SDK, create a service account and download the JSON key');
  console.log('5. Set NEXT_PUBLIC_ENABLE_FIREBASE=true');
  console.log('\n📋 Required environment variables:');
  console.log('Client (NEXT_PUBLIC_*):');
  clientRequired.forEach(key => console.log(`   - ${key}`));
  console.log('Admin (Server-side):');
  adminRequired.forEach(key => console.log(`   - ${key}`));
  process.exit(1);
} else {
  console.log('✅ All Firebase environment variables are properly configured');
  console.log(`📊 Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`🔑 API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10)}...`);
  console.log(`🏠 Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
  console.log(`📧 Admin Email: ${process.env.FIREBASE_CLIENT_EMAIL}`);
  console.log(`🔐 Admin Key: ${process.env.FIREBASE_PRIVATE_KEY?.substring(0, 20)}...`);
  
  if (hasWarnings) {
    console.log('\n⚠️  Warnings found - check the output above');
  } else {
    console.log('\n🎉 All checks passed! Firebase is ready to use.');
  }
}
