# Stars Vacation Management System

A React-based vacation management system with Firebase integration for the Stars team.

## Problem Solved

The original Firebase configuration was incomplete and missing Firestore initialization, which prevented vacation requests from being fetched from the database. This solution provides:

1. **Complete Firebase Configuration**: Includes both Firebase app initialization and Firestore setup
2. **Proper Data Fetching**: React component that correctly fetches vacation requests from Firestore
3. **Error Handling**: Comprehensive error handling for Firebase operations
4. **Authentication**: Firebase Auth integration for user management

## Files Created

- `firebase-config.js` - Complete Firebase configuration with Firestore
- `vacation-requests-component.jsx` - React component for displaying vacation requests
- `app.jsx` - Main application with routing and authentication
- `package.json` - Dependencies and scripts
- `vite.config.js` - Vite build configuration
- `index.html` - HTML entry point
- `src/main.jsx` - React entry point

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Firebase Configuration**:
   The Firebase configuration is already set up in `firebase-config.js` with your provided credentials.

3. **Firestore Security Rules**:
   Make sure your Firestore security rules allow read access. For testing, you can use:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

4. **Run the Application**:
   ```bash
   npm run dev
   ```

## Key Features

### Firebase Configuration (`firebase-config.js`)
- Initializes Firebase app with your credentials
- Sets up Firestore database connection
- Configures Firebase Authentication
- Exports all necessary services

### Vacation Requests Component (`vacation-requests-component.jsx`)
- Fetches vacation requests from Firestore
- Displays requests in a clean, organized layout
- Shows loading states and error handling
- Handles empty states gracefully

### Authentication Flow (`app.jsx`)
- Google authentication integration
- Protected routes for admin access
- User state management
- Sign out functionality

## Troubleshooting

### Common Issues

1. **"No vacation requests found"**:
   - Check if the 'vacation-requests' collection exists in Firestore
   - Verify Firestore security rules allow read access
   - Check browser console for error messages

2. **Firebase connection errors**:
   - Verify Firebase configuration credentials
   - Check if the Firebase project is active
   - Ensure Firestore is enabled in your Firebase project

3. **Authentication issues**:
   - Verify Google OAuth is configured in Firebase Console
   - Check if the domain is authorized in Firebase Auth settings

### Debug Steps

1. Open browser developer tools
2. Check the Console tab for error messages
3. Verify network requests to Firebase in the Network tab
4. Check if data exists in the Firestore console

## Database Structure

The application expects vacation requests to be stored in a Firestore collection called `vacation-requests` with documents containing:

```javascript
{
  employeeName: "John Doe",
  startDate: "2024-01-15",
  endDate: "2024-01-20",
  daysRequested: 5,
  reason: "Family vacation",
  status: "pending", // or "approved", "rejected"
  createdAt: timestamp,
  notes: "Additional notes"
}
```

## Deployment

For Vercel deployment:

1. Build the project: `npm run build`
2. Deploy to Vercel
3. Ensure environment variables are set if needed
4. Verify Firebase configuration works in production

## Security Notes

- The current Firestore rules allow public read/write access for testing
- Implement proper security rules before production deployment
- Consider implementing role-based access control
- Use Firebase Security Rules to restrict access based on user authentication
