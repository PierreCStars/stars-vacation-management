#!/usr/bin/env node

/**
 * Environment Check Script
 * Validates that all required Firebase environment variables are set
 */

import { config } from 'dotenv';

// Load .env.local first (higher priority), then .env as fallback
config({ path: '.env.local' });
config({ path: '.env' });

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

console.log('🔍 Checking Firebase environment variables...\n');

let hasErrors = false;

// Check for missing variables
const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`   - ${key}`));
  hasErrors = true;
}

// Check for placeholder values
const placeholders = required.filter(key => {
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

if (placeholders.length > 0) {
  console.error('❌ Environment variables contain placeholder values:');
  placeholders.forEach(key => {
    console.error(`   - ${key}: ${process.env[key]}`);
  });
  hasErrors = true;
}

// Check if Firebase is enabled
if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
  console.warn('⚠️  NEXT_PUBLIC_ENABLE_FIREBASE is not set to "true"');
  console.warn('   Firebase will be disabled. Set NEXT_PUBLIC_ENABLE_FIREBASE=true to enable.');
}

if (hasErrors) {
  console.log('\n💡 To fix this:');
  console.log('1. Go to https://console.firebase.google.com/project/stars-vacation-management/settings/general');
  console.log('2. Scroll down to "Your apps" section and copy the configuration');
  console.log('3. Update your .env.local file with the real values');
  console.log('4. Set NEXT_PUBLIC_ENABLE_FIREBASE=true');
  process.exit(1);
} else {
  console.log('✅ All Firebase environment variables are properly configured');
  console.log(`📊 Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`🔑 API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10)}...`);
  console.log(`🏠 Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
}
