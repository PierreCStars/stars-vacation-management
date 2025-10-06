#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Firebase Admin SDK...\n');

// Check if the environment variable exists
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found');
  process.exit(1);
}

console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY found');
console.log('📊 Length:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length);
console.log('🔍 First 100 chars:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(0, 100));

try {
  // Try to parse the JSON
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  console.log('✅ JSON parsing successful');
  console.log('📧 Client Email:', serviceAccount.client_email);
  console.log('🔑 Private Key ID:', serviceAccount.private_key_id);
  console.log('📊 Project ID:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ JSON parsing failed:', error.message);
  console.error('🔍 Error position:', error.message.match(/position (\d+)/)?.[1]);
  
  // Show the character at the error position
  const pos = parseInt(error.message.match(/position (\d+)/)?.[1] || '0');
  console.error('🔍 Character at position', pos, ':', JSON.stringify(process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(pos, pos + 10)));
  console.error('🔍 Context around position:', process.env.FIREBASE_SERVICE_ACCOUNT_KEY.substring(Math.max(0, pos - 20), pos + 20));
}









