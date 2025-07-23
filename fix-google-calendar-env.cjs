#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Google Calendar Environment Variable Check\n');

// Check if environment variables exist
const hasServiceAccountKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const hasCalendarId = !!process.env.GOOGLE_CALENDAR_ID;

console.log('📋 Environment Variables Status:');
console.log(`  GOOGLE_SERVICE_ACCOUNT_KEY: ${hasServiceAccountKey ? '✅ SET' : '❌ MISSING'}`);
console.log(`  GOOGLE_CALENDAR_ID: ${hasCalendarId ? '✅ SET' : '❌ MISSING'}`);

if (!hasServiceAccountKey) {
  console.log('\n❌ GOOGLE_SERVICE_ACCOUNT_KEY is missing!');
  console.log('Please set this environment variable in your Vercel dashboard.');
  console.log('Follow the setup guide in setup-google-calendar.md');
  process.exit(1);
}

if (!hasCalendarId) {
  console.log('\n❌ GOOGLE_CALENDAR_ID is missing!');
  console.log('Please set this environment variable in your Vercel dashboard.');
  console.log('Default calendar ID: c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com');
  process.exit(1);
}

// Test JSON parsing of service account key
console.log('\n🔍 Testing GOOGLE_SERVICE_ACCOUNT_KEY JSON parsing...');
try {
  const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  console.log('✅ JSON parsing successful');
  console.log(`  Project ID: ${serviceAccountKey.project_id || 'N/A'}`);
  console.log(`  Client Email: ${serviceAccountKey.client_email || 'N/A'}`);
  
  // Check required fields
  const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
  const missingFields = requiredFields.filter(field => !serviceAccountKey[field]);
  
  if (missingFields.length > 0) {
    console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
    console.log('Please check your service account key JSON file.');
  } else {
    console.log('✅ All required fields present');
  }
  
} catch (error) {
  console.log('❌ JSON parsing failed:', error.message);
  console.log('\n💡 Common issues:');
  console.log('1. The JSON might be escaped incorrectly in the environment variable');
  console.log('2. There might be extra quotes or characters');
  console.log('3. The JSON might be truncated');
  
  console.log('\n🔧 To fix this:');
  console.log('1. Download a fresh service account key JSON file from Google Cloud Console');
  console.log('2. Copy the entire JSON content (including the outer braces)');
  console.log('3. Paste it as a single line in your Vercel environment variable');
  console.log('4. Make sure there are no extra quotes or escaping');
  
  process.exit(1);
}

// Test calendar ID format
console.log('\n🔍 Testing GOOGLE_CALENDAR_ID format...');
const calendarId = process.env.GOOGLE_CALENDAR_ID;
if (calendarId.includes('@group.calendar.google.com') || calendarId.includes('@gmail.com')) {
  console.log('✅ Calendar ID format looks correct');
} else {
  console.log('⚠️  Calendar ID format might be incorrect');
  console.log('Expected format: something@group.calendar.google.com or something@gmail.com');
}

console.log('\n🎉 Environment variables look good!');
console.log('If approved vacation requests still don\'t appear in the calendar:');
console.log('1. Check that the service account has access to the calendar');
console.log('2. Verify the calendar ID is correct');
console.log('3. Check the Vercel deployment logs for any errors');
console.log('4. Try approving a new vacation request to test the integration'); 