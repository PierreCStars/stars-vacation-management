#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Testing environment variable format...\n');

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
console.log('Raw key length:', key?.length);
console.log('First 20 chars:', key?.substring(0, 20));
console.log('Last 20 chars:', key?.substring(key.length - 20));

// Check for quotes
console.log('\nQuote analysis:');
console.log('Starts with single quote:', key?.startsWith("'"));
console.log('Ends with single quote:', key?.endsWith("'"));
console.log('Starts with double quote:', key?.startsWith('"'));
console.log('Ends with double quote:', key?.endsWith('"'));

// Try to remove quotes
let cleanKey = key;
if (cleanKey.startsWith("'")) {
  cleanKey = cleanKey.slice(1);
  console.log('\nAfter removing opening single quote:');
  console.log('Length:', cleanKey.length);
  console.log('First 20 chars:', cleanKey.substring(0, 20));
  console.log('Last 20 chars:', cleanKey.substring(cleanKey.length - 20));
}

// Try to parse JSON
try {
  const parsed = JSON.parse(cleanKey);
  console.log('\n✅ JSON parsing successful!');
  console.log('Project ID:', parsed.project_id);
  console.log('Client Email:', parsed.client_email);
  console.log('Type:', parsed.type);
} catch (error) {
  console.log('\n❌ JSON parsing failed:', error.message);
  console.log('First 100 chars of clean key:', cleanKey.substring(0, 100));
}
