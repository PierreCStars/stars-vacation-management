# Production Environment Variables Setup for Vercel

## Required Environment Variables for Production

Based on the current logs, the following environment variables need to be configured in Vercel for the approval/rejection functionality to work properly:

### 1. Firebase Configuration (Required for data persistence)
```
NEXT_PUBLIC_ENABLE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 2. Firebase Admin (Server-side, required for data updates)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
```

### 3. Google Calendar Integration (Optional but recommended)
```
GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64=base64-encoded-service-account-key
# OR
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
GOOGLE_CLIENT_EMAIL=your-service-account@your-project-id.iam.gserviceaccount.com
```

### 4. NextAuth Configuration
```
NEXTAUTH_URL=https://your-production-domain.com
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Email Configuration (Optional)
```
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_SECURE=false
FROM_EMAIL=noreply@your-domain.com
NOTIFY_ADMIN_EMAILS=admin1@your-domain.com,admin2@your-domain.com
```

### 6. App Configuration
```
APP_BASE_URL=https://your-production-domain.com
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project
3. Go to Settings > Environment Variables
4. Add each variable above with the appropriate value
5. Make sure to set them for "Production" environment
6. Redeploy your application

## Current Status

✅ **Fixed**: Syntax error in getRequestsWithConflicts.ts
✅ **Working**: API endpoints for approval/rejection (returning 200 status)
❌ **Missing**: Firebase configuration (data not persisting)
❌ **Missing**: Google Calendar integration
❌ **Missing**: Email notifications

## Next Steps

1. Configure Firebase environment variables in Vercel
2. Test the approval/rejection functionality
3. Configure Google Calendar integration if needed
4. Set up email notifications if desired

The approval/rejection buttons should work once Firebase is properly configured, as the API endpoints are already functional.
