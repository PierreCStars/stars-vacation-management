#!/usr/bin/env node

// Load environment variables
require('dotenv/config');

/**
 * Server Startup Log Script
 * Logs app directory and .env.local status on server start
 */

const fs = require('fs');
const path = require('path');

function logStartupInfo() {
  const appRoot = process.cwd();
  const envLocalPath = path.join(appRoot, '.env.local');
  const envPath = path.join(appRoot, '.env');
  const packageJsonPath = path.join(appRoot, 'package.json');
  
  console.log('🚀 Next.js Vacation Management App Starting...');
  console.log('===============================================');
  console.log(`📁 App Root: ${appRoot}`);
  console.log(`📄 .env.local: ${fs.existsSync(envLocalPath) ? '✅ Found' : '❌ Missing'}`);
  console.log(`📄 .env: ${fs.existsSync(envPath) ? '✅ Found' : '❌ Missing'}`);
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      console.log(`📦 Package: ${packageJson.name}@${packageJson.version}`);
    } catch (error) {
      console.log('📦 Package: Unable to read package.json');
    }
  }
  
  if (!fs.existsSync(envLocalPath)) {
    console.log('');
    console.log('⚠️  WARNING: .env.local not found in app root directory!');
    console.log('💡 Please create .env.local with your environment variables.');
    console.log('   Example:');
    console.log('   NEXT_PUBLIC_ENABLE_FIREBASE=true');
    console.log('   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here');
    console.log('   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com');
    console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id');
    console.log('   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com');
    console.log('   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789');
    console.log('   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef');
    console.log('');
  }
  
  console.log('===============================================');
}

// Run the startup log
logStartupInfo();
