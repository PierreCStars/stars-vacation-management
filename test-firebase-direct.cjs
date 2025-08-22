#!/usr/bin/env node

require('dotenv').config();

console.log('🧪 Testing Direct Firebase Connection...\n');

// Import Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

console.log('📋 Configuration loaded:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  hasApiKey: !!firebaseConfig.apiKey,
  hasAppId: !!firebaseConfig.appId
});

async function testFirebase() {
  try {
    console.log('\n🚀 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    console.log('🔐 Testing Authentication...');
    const auth = getAuth(app);
    console.log('✅ Auth service initialized');
    
    console.log('📝 Testing Firestore...');
    const db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    console.log('👤 Testing Anonymous Sign-in...');
    const userCredential = await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful:', userCredential.user.uid);
    
    console.log('📊 Testing Database Query...');
    const querySnapshot = await getDocs(collection(db, 'vacationRequests'));
    console.log('✅ Database query successful, found', querySnapshot.size, 'documents');
    
    console.log('\n🎉 All Firebase tests passed!');
    
  } catch (error) {
    console.error('\n❌ Firebase test failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Provide specific solutions based on error codes
    if (error.code === 'auth/configuration-not-found') {
      console.log('\n💡 Solution for auth/configuration-not-found:');
      console.log('1. Check if Firebase project is active');
      console.log('2. Verify project ID matches exactly');
      console.log('3. Ensure Firebase services are enabled');
    } else if (error.code === 'auth/unauthorized-domain') {
      console.log('\n💡 Solution for auth/unauthorized-domain:');
      console.log('1. Add your domain to Firebase authorized domains');
      console.log('2. Go to Firebase Console > Authentication > Settings > Authorized domains');
    } else if (error.code === 'permission-denied') {
      console.log('\n💡 Solution for permission-denied:');
      console.log('1. Check Firestore security rules');
      console.log('2. Verify authentication is working');
    }
  }
}

testFirebase();
