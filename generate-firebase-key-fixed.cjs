#!/usr/bin/env node

// Load environment variables
require('dotenv').config({ path: '.env.local' });

console.log('🔧 Generating Firebase Admin Service Account Key...\n');

// Get the Google service account key
const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
if (!googleServiceAccountKey) {
  console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not found in environment variables');
  process.exit(1);
}

try {
  // The JSON contains actual newlines, so we need to handle it carefully
  // Let's extract the key parts manually
  const keyMatch = googleServiceAccountKey.match(/"private_key":"(.*?)"/s);
  const clientEmailMatch = googleServiceAccountKey.match(/"client_email":"([^"]+)"/);
  const privateKeyIdMatch = googleServiceAccountKey.match(/"private_key_id":"([^"]+)"/);
  const clientIdMatch = googleServiceAccountKey.match(/"client_id":"([^"]+)"/);
  const authUriMatch = googleServiceAccountKey.match(/"auth_uri":"([^"]+)"/);
  const tokenUriMatch = googleServiceAccountKey.match(/"token_uri":"([^"]+)"/);
  const authProviderMatch = googleServiceAccountKey.match(/"auth_provider_x509_cert_url":"([^"]+)"/);
  const clientX509Match = googleServiceAccountKey.match(/"client_x509_cert_url":"([^"]+)"/);
  const universeDomainMatch = googleServiceAccountKey.match(/"universe_domain":"([^"]+)"/);
  
  if (!keyMatch || !clientEmailMatch || !privateKeyIdMatch) {
    throw new Error('Could not extract required fields from Google service account key');
  }
  
  const privateKey = keyMatch[1];
  const clientEmail = clientEmailMatch[1];
  const privateKeyId = privateKeyIdMatch[1];
  const clientId = clientIdMatch?.[1] || '';
  const authUri = authUriMatch?.[1] || 'https://accounts.google.com/o/oauth2/auth';
  const tokenUri = tokenUriMatch?.[1] || 'https://oauth2.googleapis.com/token';
  const authProviderX509CertUrl = authProviderMatch?.[1] || 'https://www.googleapis.com/oauth2/v1/certs';
  const clientX509CertUrl = clientX509Match?.[1] || '';
  const universeDomain = universeDomainMatch?.[1] || 'googleapis.com';
  
  // Create Firebase Admin service account key
  const firebaseAdminKey = {
    type: "service_account",
    project_id: "stars-vacation-management",
    private_key_id: privateKeyId,
    private_key: privateKey,
    client_email: `firebase-adminsdk-${privateKeyId.substring(0, 8)}@stars-vacation-management.iam.gserviceaccount.com`,
    client_id: clientId,
    auth_uri: authUri,
    token_uri: tokenUri,
    auth_provider_x509_cert_url: authProviderX509CertUrl,
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-${privateKeyId.substring(0, 8)}%40stars-vacation-management.iam.gserviceaccount.com`,
    universe_domain: universeDomain
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
  console.error('Stack:', error.stack);
  process.exit(1);
}
