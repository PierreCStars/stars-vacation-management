#!/usr/bin/env node

/**
 * Script to generate a new Firebase service account key
 * This will help regenerate the Firebase credentials for Vercel
 */

const fs = require('fs');

function generateNewFirebaseKey() {
  console.log('🔑 Generating new Firebase service account key...');
  
  // Check if firebase-key.json exists
  if (fs.existsSync('firebase-key.json')) {
    console.log('📋 Current Firebase key data:');
    try {
      const keyData = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'));
      console.log('- project_id:', keyData.project_id);
      console.log('- client_email:', keyData.client_email);
      console.log('- private_key_id:', keyData.private_key_id);
      
      // Generate the environment variable format
      const envFormat = {
        FIREBASE_PROJECT_ID: keyData.project_id,
        FIREBASE_ADMIN_CLIENT_EMAIL: keyData.client_email,
        FIREBASE_ADMIN_PRIVATE_KEY: keyData.private_key
      };
      
      console.log('\n📝 Environment variables for Vercel:');
      console.log('Copy these to your Vercel environment variables:');
      console.log('=====================================');
      Object.entries(envFormat).forEach(([key, value]) => {
        console.log(`${key}=${value}`);
      });
      console.log('=====================================');
      
      // Also save to a file for easy copying
      const envContent = Object.entries(envFormat)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync('firebase-env-vars.txt', envContent);
      console.log('\n💾 Environment variables saved to firebase-env-vars.txt');
      console.log('📋 You can copy the contents of this file to Vercel environment variables');
      
    } catch (error) {
      console.error('❌ Error reading firebase-key.json:', error.message);
    }
  } else {
    console.log('❌ firebase-key.json does not exist');
    console.log('📋 Please download a new Firebase service account key from:');
    console.log('   https://console.firebase.google.com/project/stars-vacation-management/settings/serviceaccounts/adminsdk');
    console.log('   Save it as firebase-key.json in the project root');
  }
}

generateNewFirebaseKey();
