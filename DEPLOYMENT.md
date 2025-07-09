# Firebase Deployment Guide

This guide explains how to deploy your Next.js vacation management app to Firebase using Hosting + Cloud Functions.

## ✅ Prerequisites

1. Firebase project created: `stars-vacation-management`
2. Firebase CLI installed and authenticated
3. Node.js 18+ installed
4. All build issues resolved ✅

## Project Structure

```
stars-vacation-management/
├── src/                    # Next.js app source
├── stars-codebase/         # Cloud Functions
├── firebase.json          # Firebase configuration
├── .firebaserc           # Firebase project settings
└── firestore.rules       # Firestore security rules
```

## 🚀 Deployment Steps

### 1. Build the Next.js App
```bash
npm run build
```

### 2. Deploy Cloud Functions
```bash
npm run deploy:functions
```

### 3. Deploy Hosting
```bash
npm run deploy:hosting
```

### 4. Deploy Everything
```bash
npm run deploy:firebase
```

## 🔧 Environment Variables

Set up your environment variables in the Firebase Console:

1. Go to Firebase Console > Functions > Configuration
2. Add your environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your Firebase hosting URL)
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `GOOGLE_CALENDAR_ID`
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string)

## 📝 Important Notes

- ✅ The app uses Cloud Functions for server-side rendering
- ✅ API routes (`/api/*`) are handled by Cloud Functions
- ✅ Static assets are served by Firebase Hosting
- ✅ Firestore is used for data storage
- ✅ All Tailwind CSS issues resolved
- ✅ TypeScript errors fixed

## 🔍 Troubleshooting

1. **Function deployment fails**: Check Node.js version (should be 18)
2. **Environment variables missing**: Set them in Firebase Console
3. **Build errors**: All resolved ✅

## 🌐 URLs

- **Production**: https://stars-vacation-management.web.app
- **Functions**: https://us-central1-stars-vacation-management.cloudfunctions.net

## 🎉 Ready to Deploy!

Your app is now ready for Firebase deployment. All build issues have been resolved:

- ✅ Tailwind CSS errors fixed
- ✅ TypeScript errors resolved
- ✅ Gmail service constructor updated
- ✅ Cloud Functions properly configured
- ✅ Build process working

Run `npm run deploy:firebase` to deploy your app! 