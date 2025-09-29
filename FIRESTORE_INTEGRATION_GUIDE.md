# Firestore Integration Guide

This guide explains how to integrate the existing Firestore database from the Firebase project `stars-vacation-management` into your application.

## 🚀 Quick Start

### 1. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/project/stars-vacation-management/settings/general)
2. Scroll down to "Your apps" section
3. Click on the web app or create a new one
4. Copy the configuration values

### 2. Update Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration (Client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_actual_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_actual_app_id
NEXT_PUBLIC_ENABLE_FIREBASE=true

# Firebase Admin Configuration (Server-side)
FIREBASE_PROJECT_ID=stars-vacation-management
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key_with_newlines"
```

### 3. Get Service Account Key

1. Go to [Service Accounts](https://console.firebase.google.com/project/stars-vacation-management/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the `client_email` and `private_key` values

### 4. Test the Integration

```bash
# Test Firestore connection
node test-firestore-integration.cjs

# Check existing data
node check-database.cjs

# Import sample data (optional)
node import-firebase-data.cjs
```

## 📁 Files Created/Modified

### New Files
- `src/lib/firebase.ts` - Enhanced with VacationRequestsService
- `test-firestore-integration.cjs` - Integration test script
- `firestore.rules` - Security rules
- `firebase-config-template.txt` - Configuration template

### Modified Files
- `src/app/api/vacation-requests/route.ts` - Updated to use Firestore
- `src/app/api/vacation-requests/[id]/route.ts` - Updated to use Firestore

## 🔧 API Endpoints

### GET /api/vacation-requests
- Fetches all vacation requests from Firestore
- Falls back to mock data if Firebase is unavailable

### POST /api/vacation-requests
- Creates new vacation request in Firestore
- Sends admin notification email
- Falls back to temporary storage if Firebase is unavailable

### PATCH /api/vacation-requests/[id]
- Updates vacation request status (approve/reject)
- Uses VacationRequestsService for database operations
- Syncs approved requests to Google Calendar

## 🛡️ Security Rules

The Firestore security rules are configured in `firestore.rules`:

- **Read Access**: All authenticated users can read vacation requests
- **Write Access**: Users can only create/update their own requests
- **Admin Access**: Admins can update/delete any request
- **Admin Emails**: pierre@stars.mc, johnny@stars.mc, daniel@stars.mc, compta@stars.mc

## 🧪 Testing

### Local Testing
```bash
# Start the development server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/vacation-requests
```

### Integration Testing
```bash
# Run the integration test
node test-firestore-integration.cjs
```

## 🚀 Deployment

### Vercel Deployment

1. **Set Environment Variables in Vercel:**
   - Go to your Vercel project settings
   - Add all the Firebase environment variables
   - Make sure `NEXT_PUBLIC_ENABLE_FIREBASE=true`

2. **Deploy Firestore Rules:**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Deploy rules
   firebase deploy --only firestore:rules
   ```

3. **Enable Anonymous Authentication:**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Anonymous authentication

### Environment Variables for Production

Make sure these are set in your Vercel environment:

```bash
# Public Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_production_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=stars-vacation-management.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=stars-vacation-management
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=stars-vacation-management.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_production_app_id
NEXT_PUBLIC_ENABLE_FIREBASE=true

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=stars-vacation-management
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key_with_newlines"
```

## 🔍 Troubleshooting

### Common Issues

1. **Permission Denied Error**
   - Check Firestore security rules
   - Ensure Anonymous authentication is enabled
   - Verify user is authenticated

2. **Firebase Not Initialized Error**
   - Check all environment variables are set
   - Verify Firebase project ID is correct
   - Ensure `NEXT_PUBLIC_ENABLE_FIREBASE=true`

3. **Service Account Issues**
   - Verify service account has proper permissions
   - Check private key format (newlines should be `\n`)
   - Ensure service account email is correct

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)"

# Test Firebase connection
node check-database.cjs

# Run integration tests
node test-firestore-integration.cjs
```

## 📊 Data Structure

### Vacation Request Document
```typescript
{
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: Timestamp;
  adminComment?: string;
}
```

## 🎯 Next Steps

1. **Configure Firebase** with your actual project credentials
2. **Test the integration** using the provided scripts
3. **Deploy to production** with proper environment variables
4. **Monitor usage** through Firebase Console
5. **Set up monitoring** and error tracking

## 📞 Support

If you encounter any issues:

1. Check the Firebase Console for errors
2. Review the application logs
3. Test with the provided integration scripts
4. Verify all environment variables are correctly set

The integration is designed to gracefully fall back to mock data if Firebase is unavailable, ensuring your application continues to work during development and testing.
