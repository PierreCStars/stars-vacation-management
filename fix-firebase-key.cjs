#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Fixing Firebase Service Account Key...\n');

if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found');
  process.exit(1);
}

try {
  // The key contains literal \n characters that need to be replaced with actual newlines
  const fixedKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n');
  
  // Parse to validate
  const serviceAccount = JSON.parse(fixedKey);
  
  console.log('✅ Key fixed and validated');
  console.log('📧 Client Email:', serviceAccount.client_email);
  console.log('🔑 Private Key ID:', serviceAccount.private_key_id);
  console.log('📊 Project ID:', serviceAccount.project_id);
  
  // Write the fixed key back to .env.local
  const fs = require('fs');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const fixedEnvContent = envContent.replace(
    /FIREBASE_SERVICE_ACCOUNT_KEY=.*/,
    `FIREBASE_SERVICE_ACCOUNT_KEY='${JSON.stringify(serviceAccount)}'`
  );
  
  fs.writeFileSync('.env.local', fixedEnvContent);
  console.log('✅ Updated .env.local with fixed key');
  
} catch (error) {
  console.error('❌ Error fixing key:', error.message);
  process.exit(1);
}









