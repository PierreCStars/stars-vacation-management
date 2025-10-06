#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Creating Firebase Service Account Key...\n');

if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found');
  process.exit(1);
}

try {
  // Parse the Google service account key
  const googleKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  
  // Create Firebase Admin service account key with proper formatting
  const firebaseAdminKey = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "stars-vacation-management",
    private_key_id: googleKey.private_key_id,
    private_key: googleKey.private_key, // This already has proper newlines
    client_email: `firebase-adminsdk-${googleKey.private_key_id.substring(0, 8)}@${process.env.FIREBASE_PROJECT_ID || "stars-vacation-management"}.iam.gserviceaccount.com`,
    client_id: googleKey.client_id,
    auth_uri: googleKey.auth_uri,
    token_uri: googleKey.token_uri,
    auth_provider_x509_cert_url: googleKey.auth_provider_x509_cert_url,
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${googleKey.private_key_id.substring(0, 8)}%40${process.env.FIREBASE_PROJECT_ID || "stars-vacation-management"}.iam.gserviceaccount.com`,
    universe_domain: googleKey.universe_domain
  };

  // Convert to JSON string
  const firebaseAdminKeyString = JSON.stringify(firebaseAdminKey);
  
  console.log('✅ Firebase Admin Service Account Key created');
  console.log('📧 Client Email:', firebaseAdminKey.client_email);
  console.log('🔑 Private Key ID:', firebaseAdminKey.private_key_id);
  console.log('📊 Project ID:', firebaseAdminKey.project_id);
  
  // Update .env.local
  const fs = require('fs');
  const envContent = fs.readFileSync('.env.local', 'utf8');
  
  // Remove existing FIREBASE_SERVICE_ACCOUNT_KEY if it exists
  const cleanedEnvContent = envContent.replace(/FIREBASE_SERVICE_ACCOUNT_KEY=.*\n?/g, '');
  
  // Add the new key
  const newEnvContent = cleanedEnvContent.trim() + '\n\nFIREBASE_SERVICE_ACCOUNT_KEY=\'' + firebaseAdminKeyString + '\'\n';
  
  fs.writeFileSync('.env.local', newEnvContent);
  console.log('✅ Updated .env.local with new Firebase Admin key');
  
} catch (error) {
  console.error('❌ Error creating key:', error.message);
  process.exit(1);
}









