# Stars Vacation Management System

A comprehensive vacation request management system with Google Calendar integration, built with Next.js, TypeScript, and Firebase.

## Features

- Vacation request submission and approval workflow
- Google Calendar integration
- Multi-language support (EN, FR, IT)
- Admin dashboard with analytics
- Email notifications
- **Automated overdue request notifications** - Admins receive daily emails for requests pending review for 3+ days

## Automated Notifications

The system includes an automated notification system to ensure vacation requests are reviewed promptly:

### Overdue Request Notifications

- **Trigger**: Vacation requests that remain in "pending" status for 3+ days
- **Frequency**: Daily check at 9:00 AM UTC via Vercel Cron
- **Recipients**: Admin users (configured via email settings)
- **Content**: 
  - Request details (employee, dates, reason, company)
  - Days overdue count
  - Direct link to review the request in the admin panel
  - Professional HTML and plain text email formats

### Manual Testing

You can manually trigger the overdue request check:

```bash
# Test the cron endpoint locally
curl http://localhost:3000/api/cron/check-pending-requests

# Or via POST
curl -X POST http://localhost:3000/api/cron/check-pending-requests
```

### Configuration

The notification system is automatically configured when deployed to Vercel. The cron job runs daily and requires:

- Firebase Admin SDK access (for querying requests)
- SMTP configuration (for sending emails)
- Proper environment variables (see Environment Variables section)

## Development

```bash
npm install
npm run dev
```

## Firestore Setup

This application uses Firebase Firestore for data storage. Follow these steps to set up the database:

### 1. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/stars-vacation-management/settings/general)
2. Scroll down to "Your apps" section
3. Copy the web app configuration values

### 2. Get Firebase Service Account (Admin SDK)

1. Go to [Firebase Console → Service Accounts](https://console.firebase.google.com/project/stars-vacation-management/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the following values:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` escapes for Vercel)

### 3. Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Firebase Client Configuration (for browser)
# Set to 'true' to enable Firebase client-side features
NEXT_PUBLIC_ENABLE_FIREBASE=true

# Firebase Project Configuration
# Get these values from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id

# Optional: Enable anonymous authentication in development
NEXT_PUBLIC_ENABLE_ANON_AUTH=true

# Firebase Admin SDK Configuration (for server-side)
FIREBASE_PROJECT_ID=stars-vacation-management
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@stars-vacation-management.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 4. Client Firebase Setup

The application uses a client-side Firebase configuration that can be enabled/disabled via environment variables:

- **NEXT_PUBLIC_ENABLE_FIREBASE**: Set to `'true'` to enable Firebase client features
- **NEXT_PUBLIC_ENABLE_ANON_AUTH**: Set to `'true'` to enable anonymous authentication in development
- All `NEXT_PUBLIC_FIREBASE_*` variables are required when Firebase is enabled

**Important**: Add `localhost` to Firebase Authorized Domains in the Firebase Console:
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add `localhost` to the list for development

#### 4.1 Fail-Fast Configuration Validation

The app now includes strict validation to prevent common configuration errors:

- **Placeholder Detection**: Automatically detects and rejects placeholder values like `your_project_id_here`
- **Missing Variables**: Fails fast if any required environment variables are missing
- **Configuration Warnings**: Shows clear error messages in the console and UI

#### 4.2 Development Diagnostics

In development mode, you'll see:
- **Firebase Diagnostics Panel**: Bottom-right corner showing configuration status
- **Warning Banners**: Clear indicators when Firebase is disabled or misconfigured
- **Real-time Status**: Live updates of Firebase connection and environment variable status

### 5. Test the Setup

```bash
# Check environment variables
npm run dev:env-check

# Test Firestore integration
npm run test:firestore:admin

# Visit debug page
open http://localhost:3000/debug/firebase
```

### 6. Deploy Security Rules

```bash
# Deploy Firestore security rules
firebase deploy --only firestore:rules
```

### 7. Vercel Deployment

For Vercel deployment, add all environment variables to your project settings. **Important**: The `FIREBASE_PRIVATE_KEY` must preserve the `\n` line breaks in the Vercel dashboard.

## Firebase & Firestore Debugging

### Debug Tools

1. **Environment Check**: `npm run dev:env-check`
2. **Admin SDK Test**: `npm run test:firestore:admin`
3. **Debug Page**: Visit `/debug/firebase` for comprehensive diagnostics
4. **Admin Diagnostics**: The admin page includes a collapsible Firebase diagnostics panel

### Common Issues

#### Permission Denied Errors
- **Cause**: Firestore security rules require authentication
- **Solution**: Ensure Anonymous authentication is enabled in Firebase Console
- **Check**: Visit `/debug/firebase` to verify auth status

#### Environment Variable Issues
- **Cause**: Missing or placeholder values in environment variables
- **Solution**: Run `npm run dev:env-check` to validate configuration
- **Fix**: Update `.env.local` with real Firebase credentials

#### Project ID Mismatch
- **Cause**: Client and Admin SDK using different project IDs
- **Solution**: Ensure `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `FIREBASE_PROJECT_ID` match

### Firestore Security Rules

Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

Current rules require authentication for all operations:
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

### Development vs Production

- **Development**: Uses Anonymous authentication for testing
- **Production**: Requires proper user authentication
- **Security**: Rules are stricter in production (users can only access their own data)

## Deployment

This project is deployed on Vercel with automatic deployments from the main branch.

<!-- Force new deployment: 2024-01-08 -->
<!-- Deployment trigger: 2024-01-08 17:45:00 -->
<!-- Force Vercel to use latest commit 11199b1 with locale JSON fixes -->
<!-- Previous commit: 29cc05c - Vercel needs to use 11199b1 -->
<!-- Force latest commit deployment: 2024-01-08 -->
