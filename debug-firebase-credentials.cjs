#!/usr/bin/env node

/**
 * Script to debug Firebase credentials
 */

const fs = require('fs');

function debugFirebaseCredentials() {
  console.log('🔍 Debugging Firebase credentials...');
  
  // Check if firebase-key.json exists
  if (fs.existsSync('firebase-key.json')) {
    console.log('✅ firebase-key.json exists');
    try {
      const keyData = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'));
      console.log('📋 Firebase key data:');
      console.log('- project_id:', keyData.project_id);
      console.log('- client_email:', keyData.client_email);
      console.log('- private_key length:', keyData.private_key ? keyData.private_key.length : 'undefined');
      console.log('- private_key starts with:', keyData.private_key ? keyData.private_key.substring(0, 50) + '...' : 'undefined');
      
      // Check if private key has proper format
      if (keyData.private_key && keyData.private_key.includes('\\n')) {
        console.log('⚠️  Private key contains \\n characters (needs normalization)');
      } else if (keyData.private_key && keyData.private_key.includes('\n')) {
        console.log('✅ Private key has proper newline format');
      } else {
        console.log('⚠️  Private key format unclear');
      }
    } catch (error) {
      console.error('❌ Error reading firebase-key.json:', error.message);
    }
  } else {
    console.log('❌ firebase-key.json does not exist');
  }
  
  // Check environment variables
  console.log('\n🔍 Environment variables:');
  console.log('- FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID ? 'SET' : 'NOT SET');
  console.log('- FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL ? 'SET' : 'NOT SET');
  console.log('- FIREBASE_ADMIN_PRIVATE_KEY:', process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'SET' : 'NOT SET');
  
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    console.log('- Private key length:', privateKey.length);
    console.log('- Private key starts with:', privateKey.substring(0, 50) + '...');
    console.log('- Contains \\n:', privateKey.includes('\\n'));
    console.log('- Contains actual newlines:', privateKey.includes('\n'));
  }
}

debugFirebaseCredentials();
