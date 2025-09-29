#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

/**
 * Generate Firebase Admin Service Account Key
 * This script creates a Firebase Admin service account key from the existing Google service account
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Generating Firebase Admin Service Account Key...\n');

// Check if Google service account key exists
const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!googleServiceAccountKey) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables');
  process.exit(1);
}

try {
  // Parse the Google service account key
  const googleKey = JSON.parse(googleServiceAccountKey);
  
  // Create Firebase Admin service account key
  const firebaseAdminKey = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "stars-vacation-management",
    private_key_id: googleKey.private_key_id,
    private_key: googleKey.private_key,
    client_email: `firebase-adminsdk-${googleKey.private_key_id.substring(0, 8)}@${process.env.FIREBASE_PROJECT_ID || "stars-vacation-management"}.iam.gserviceaccount.com`,
    client_id: googleKey.client_id,
    auth_uri: googleKey.auth_uri,
    token_uri: googleKey.token_uri,
    auth_provider_x509_cert_url: googleKey.auth_provider_x509_cert_url,
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${googleKey.private_key_id.substring(0, 8)}%40${process.env.FIREBASE_PROJECT_ID || "stars-vacation-management"}.iam.gserviceaccount.com`,
    universe_domain: googleKey.universe_domain
  };

  // Convert to JSON string with proper escaping for .env file
  const firebaseAdminKeyString = JSON.stringify(firebaseAdminKey);

  console.log('✅ Firebase Admin Service Account Key generated:');
  console.log(`📧 Client Email: ${firebaseAdminKey.client_email}`);
  console.log(`🔑 Private Key ID: ${firebaseAdminKey.private_key_id}`);
  console.log(`📊 Project ID: ${firebaseAdminKey.project_id}`);
  
  console.log('\n📝 Add this to your .env.local file:');
  console.log(`FIREBASE_SERVICE_ACCOUNT_KEY='${firebaseAdminKeyString}'`);
  
  console.log('\n💡 Note: You may need to create this service account in the Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${firebaseAdminKey.project_id}/settings/serviceaccounts/adminsdk`);
  
} catch (error) {
  console.error('❌ Error generating Firebase Admin key:', error.message);
  process.exit(1);
}
