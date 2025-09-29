// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const enabled = process.env.NEXT_PUBLIC_ENABLE_FIREBASE?.trim() === 'true';

export function getFirebaseClient() {
  if (!enabled) return null;
  
  const cfg = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim()!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim()!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim()!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim()!,
  };
  
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return { app, auth: getAuth(app), db: getFirestore(app) };
}
