const admin = require('firebase-admin');

// Test service account credentials
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID?.trim(),
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim(),
  privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

console.log('Service Account Details:');
console.log('- Project ID:', serviceAccount.projectId);
console.log('- Client Email:', serviceAccount.clientEmail);
console.log('- Private Key (first 50 chars):', serviceAccount.privateKey?.substring(0, 50) + '...');

try {
  // Initialize Firebase Admin
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  console.log('\n✅ Firebase Admin initialized successfully');

  // Test Firestore connection
  const db = admin.firestore();
  
  // Try to read a document
  db.collection('_test').doc('ping').get()
    .then((doc) => {
      console.log('✅ Firestore connection successful');
      console.log('Document exists:', doc.exists);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Firestore error:', error.message);
      console.error('Error code:', error.code);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
  process.exit(1);
}
