# Firebase Configuration Fix Guide

## Current Issues:
1. **Placeholder API Keys**: Your .env file contains placeholder values
2. **No Authentication**: Firebase client doesn't use auth tokens
3. **Overly Permissive Rules**: Firestore allows all operations

## Steps to Fix:

### 1. Get Real Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `stars-vacation-management`
3. Go to Project Settings > General
4. Scroll down to "Your apps" section
5. Copy the actual values for:
   - `apiKey`
   - `messagingSenderId` 
   - `appId`

### 2. Update Your .env File
Replace the placeholder values with real ones:
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC... # Your actual API key
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789 # Your actual sender ID
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef # Your actual app ID
```

### 3. Fix Firestore Security Rules
Update `firestore.rules` to:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vacationRequests/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Add Firebase Authentication
Update `src/lib/firebase.ts` to include auth:
```javascript
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth(app);

// Initialize auth before database operations
export async function initializeFirebaseAuth() {
  try {
    await signInAnonymously(auth);
    console.log('✅ Firebase auth initialized');
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
  }
}
```

### 5. Test the Fix
```bash
# Update your .env with real values
# Deploy updated firestore.rules
firebase deploy --only firestore:rules

# Test locally
npm run dev
```

## Expected Results:
- ✅ API calls should work with proper authentication
- ✅ Firestore operations should be secure
- ✅ No more "Unauthorized" errors 