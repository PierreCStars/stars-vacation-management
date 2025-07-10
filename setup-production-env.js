#!/usr/bin/env node

const fs = require('fs');
const crypto = require('crypto');

console.log('🔧 Setting up production environment variables...\n');

// Generate a secure NEXTAUTH_SECRET
const generateSecret = () => {
  return crypto.randomBytes(32).toString('base64');
};

// Create .env.local template
const envTemplate = `# NextAuth Configuration
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=${generateSecret()}

# Google OAuth - REPLACE WITH ACTUAL VALUES FROM GOOGLE CONSOLE
GOOGLE_ID=your-google-client-id-here
GOOGLE_SECRET=your-google-client-secret-here

# Firebase Configuration - REPLACE WITH ACTUAL VALUES FROM FIREBASE CONSOLE
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-actual-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-actual-app-id

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PROJECT_ID=stars-vacation-management
FIREBASE_ADMIN_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@stars-vacation-management.iam.gserviceaccount.com
FIREBASE_ADMIN_CLIENT_ID=your-client-id
FIREBASE_ADMIN_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_ADMIN_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_ADMIN_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40stars-vacation-management.iam.gserviceaccount.com
`;

// Write the template to .env.local
fs.writeFileSync('.env.local', envTemplate);

console.log('✅ Created .env.local template with secure NEXTAUTH_SECRET');
console.log('');
console.log('📋 Next steps:');
console.log('1. Replace placeholder values with your actual credentials');
console.log('2. Get Google OAuth credentials from: https://console.cloud.google.com/');
console.log('3. Get Firebase config from: https://console.firebase.google.com/');
console.log('4. Update NEXTAUTH_URL to your production domain');
console.log('');
console.log('⚠️  IMPORTANT: Never commit .env.local to version control!');
console.log('   It should already be in your .gitignore file.');
console.log('');
console.log('🚀 Your app is ready for production deployment!'); 