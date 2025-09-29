#!/usr/bin/env node

/**
 * Test Environment Variables Access
 * This script tests if environment variables are accessible
 */

// Load .env.local first (higher priority), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🧪 Testing Environment Variables Access...\n');

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
];

console.log('📋 Environment Variables Status:');
required.forEach(key => {
  const value = process.env[key];
  const status = value ? '✅' : '❌';
  const displayValue = value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : 'NOT SET';
  console.log(`${status} ${key}: ${displayValue}`);
});

const missing = required.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.log(`\n❌ Missing ${missing.length} environment variables:`);
  missing.forEach(key => console.log(`   - ${key}`));
  console.log('\n💡 Make sure these are set in your .env.local file');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are present');
  console.log('🎉 Environment variables test passed!');
}
