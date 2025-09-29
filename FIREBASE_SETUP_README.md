# Firebase Setup Guide

This guide explains how to properly configure Firebase for the Stars Vacation Management application.

## 🚨 Current Issue

The application is currently using placeholder Firebase configuration values, which causes `PERMISSION_DENIED` errors. You need to replace these with actual Firebase project credentials.

## 🔧 Quick Fix

### 1. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/stars-vacation-management/settings/general)
2. Scroll down to "Your apps" section
3. Click on the web app or create a new one
4. Copy the configuration values

### 2. Update Environment Variables

Replace the placeholder values in your `.env.local` file:

```bash
# Replace these placeholder values:
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# With actual values from Firebase Console:
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBvQZ8Q9X2Y3Z4A5B6C7D8E9F0G1H2I3J4K5L
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abcdef
NEXT_PUBLIC_ENABLE_FIREBASE=true
```

### 3. Test the Configuration

```bash
# Check environment variables
npm run env:check

# Test Firebase integration
node test-firestore-integration.cjs

# Visit debug page
open http://localhost:3000/debug/firebase
```

## 📋 Complete Environment Variables

### Client-side (NEXT_PUBLIC_*)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
NEXT_PUBLIC_ENABLE_FIREBASE=true
```

### Server-side (Admin SDK)
```bash
FIREBASE_PROJECT_ID=stars-vacation-management
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@stars-vacation-management.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

## 🛠️ Development Scripts

- `npm run env:check` - Validate Firebase environment variables
- `npm run preview:build` - Check env vars before building
- `node test-firestore-integration.cjs` - Test Firestore connection
- `node check-database.cjs` - Check existing data

## 🔍 Debug Tools

### Debug Page
Visit `/debug/firebase` to see:
- Environment variable status
- Firebase initialization status
- Vacation requests service status
- Recommendations for fixes

### Console Logs
The app will log Firebase status on startup:
- ✅ Firebase initialized successfully
- 📊 Firebase projectId: stars-vacation-management
- ❌ Firebase configuration error: [details]

## 🚀 Deployment

### Vercel
1. Add all environment variables to Vercel project settings
2. Deploy with `vercel --prod`
3. Verify at `https://your-app.vercel.app/debug/firebase`

### Firebase Rules
Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

## 🔒 Security Rules

Current rules allow open access for testing. For production, update `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /vacationRequests/{requestId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🐛 Troubleshooting

### Permission Denied
- Check Firestore security rules
- Verify environment variables are set correctly
- Ensure Anonymous authentication is enabled

### Configuration Error
- Run `npm run env:check` to validate variables
- Check for placeholder values like "your_project_id_here"
- Verify all required variables are present

### Firebase Not Initialized
- Check `NEXT_PUBLIC_ENABLE_FIREBASE=true`
- Verify project ID matches Firebase Console
- Check browser console for detailed errors

## 📞 Support

If you encounter issues:
1. Check the debug page: `/debug/firebase`
2. Run environment check: `npm run env:check`
3. Review Firebase Console for errors
4. Check application logs for detailed error messages

The integration is designed to gracefully fall back to mock data if Firebase is unavailable, ensuring your application continues to work during development and testing.
