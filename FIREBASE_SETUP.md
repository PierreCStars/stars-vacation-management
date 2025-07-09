# Firebase Setup Guide for Vacation Management System

This guide will help you set up Firebase as the database for your vacation management system, replacing Google Sheets.

## 🚀 Benefits of Using Firebase

- **Real-time updates** - Changes appear instantly
- **Better performance** - Faster queries and operations  
- **Scalability** - Handles more data efficiently
- **Offline support** - Works without internet
- **Better security** - Row-level security rules
- **No API limits** - Unlike Google Sheets API

## 📋 Prerequisites

1. A Google account
2. Node.js and npm installed
3. Your existing vacation management system

## 🔧 Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `stars-vacation-management`
4. Enable Google Analytics (optional)
5. Click **"Create project"**

## 🔧 Step 2: Set Up Firestore Database

1. In your Firebase project, click **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll add security rules later)
4. Select a location close to your users (e.g., `europe-west3`)
5. Click **"Done"**

## 🔧 Step 3: Get Firebase Configuration

1. In your Firebase project, click the gear icon ⚙️ next to "Project Overview"
2. Select **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the web icon (</>) to add a web app
5. Enter app nickname: `vacation-management-web`
6. Click **"Register app"**
7. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## 🔧 Step 4: Update Environment Variables

Add these Firebase configuration variables to your `.env.local` file:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

## 🔧 Step 5: Install Firebase SDK

The Firebase SDK has already been installed. If not, run:

```bash
npm install firebase
```

## 🔧 Step 6: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Try creating a vacation request
3. Check the Firebase console to see if data is being stored

## 🔧 Step 7: Set Up Security Rules (Optional but Recommended)

1. In Firestore Database, go to **"Rules"** tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to vacation requests for authenticated users
    match /vacationRequests/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click **"Publish"**

## 🔧 Step 8: Migrate Existing Data (Optional)

If you have existing data in Google Sheets, you can migrate it:

1. Export your Google Sheets data as CSV
2. Use the Firebase console to import the data
3. Or create a migration script

## 📊 Data Structure

The system will create a `vacationRequests` collection with documents containing:

```javascript
{
  id: "auto-generated",
  userId: "user-email-or-id",
  userName: "User Name",
  startDate: "2024-01-01",
  endDate: "2024-01-05",
  reason: "Vacation reason",
  company: "STARS",
  type: "PAID_VACATION",
  status: "PENDING",
  createdAt: "timestamp",
  reviewedBy: "admin-name",
  reviewerEmail: "admin@stars.mc",
  reviewedAt: "timestamp",
  adminComment: "Admin comment"
}
```

## 🔍 Monitoring and Analytics

1. **Firebase Console**: Monitor database usage and performance
2. **Firebase Analytics**: Track user behavior (if enabled)
3. **Firebase Logs**: View detailed logs for debugging

## 🚨 Important Notes

1. **Costs**: Firebase has a generous free tier. Monitor usage in the console.
2. **Backup**: Firebase automatically backs up your data.
3. **Scaling**: Firebase automatically scales as your data grows.
4. **Security**: Always set up proper security rules for production.

## 🆘 Troubleshooting

### Common Issues:

1. **"Firebase not initialized"**
   - Check that all environment variables are set correctly
   - Restart your development server

2. **"Permission denied"**
   - Check Firestore security rules
   - Ensure user is authenticated

3. **"Collection not found"**
   - The collection will be created automatically when you add the first document

### Getting Help:

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Support](https://firebase.google.com/support)
- Check the browser console for detailed error messages

## ✅ Migration Complete!

Your vacation management system is now using Firebase instead of Google Sheets. You should notice:

- Faster loading times
- Real-time updates
- Better performance
- More reliable data storage

The system will continue to work exactly as before, but with improved performance and reliability! 