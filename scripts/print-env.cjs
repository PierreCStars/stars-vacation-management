#!/usr/bin/env node

// Load environment variables
require('dotenv/config');

/**
 * Environment Variable Validation Script
 * Loads .env.local and .env files and validates Firebase configuration
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env files
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

// Load environment variables
const envLocal = loadEnvFile(path.join(process.cwd(), '.env.local'));
const env = loadEnvFile(path.join(process.cwd(), '.env'));

// Merge environment variables (local takes precedence)
const mergedEnv = { ...env, ...envLocal };

// Set environment variables
Object.assign(process.env, mergedEnv);

// Required Firebase environment variables
const requiredFirebaseVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

console.log('🔍 Environment Variable Validation');
console.log('=====================================');
console.log(`📁 App Root: ${process.cwd()}`);
console.log(`📄 .env.local: ${fs.existsSync('.env.local') ? '✅ Found' : '❌ Missing'}`);
console.log(`📄 .env: ${fs.existsSync('.env') ? '✅ Found' : '❌ Missing'}`);
console.log('');

// Check Firebase enable flag
const firebaseEnabled = process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true';
console.log(`🔥 Firebase Enabled: ${firebaseEnabled ? '✅ Yes' : '❌ No'}`);
console.log('');

if (firebaseEnabled) {
  console.log('🔧 Firebase Configuration:');
  console.log('---------------------------');
  
  let allPresent = true;
  
  requiredFirebaseVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      // Mask API key for security
      const displayValue = varName.includes('API_KEY') 
        ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    } else {
      console.log(`❌ ${varName}: UNDEFINED`);
      allPresent = false;
    }
  });
  
  console.log('');
  
  if (!allPresent) {
    console.log('❌ ERROR: Missing required Firebase environment variables!');
    console.log('');
    console.log('💡 Solution:');
    console.log('1. Ensure .env.local exists in the app root directory');
    console.log('2. Add all required NEXT_PUBLIC_FIREBASE_* variables');
    console.log('3. Set NEXT_PUBLIC_ENABLE_FIREBASE=true');
    console.log('4. Restart the development server');
    process.exit(1);
  } else {
    console.log('✅ All Firebase environment variables are present!');
  }
} else {
  console.log('ℹ️  Firebase is disabled. Set NEXT_PUBLIC_ENABLE_FIREBASE=true to enable.');
}

console.log('');
console.log('🎯 Environment validation complete!');