# Environment Variables Documentation

## Required Environment Variables

### Server-side (Firebase Admin)
These variables are required for Firebase Admin SDK to work on the server:

```bash
# Option 1: Combined service account key (recommended)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}

# Option 2: Separate environment variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Client-side (Firebase Client)
These variables are required for Firebase Client SDK to work in the browser:

```bash
NEXT_PUBLIC_ENABLE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Current Status

Based on the diagnostic results:

### ✅ **Working:**
- `FIREBASE_PROJECT_ID`: Set to "stars-vacation-management"
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Present and parseable
- Service account key contains valid project ID and client email

### ❌ **Missing/Invalid:**
- `NEXT_PUBLIC_ENABLE_FIREBASE`: Missing (should be "true")
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Missing
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Missing
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Set to placeholder value
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Set to placeholder value

### 🔧 **Issue:**
- Firebase Admin initializes but gets "16 UNAUTHENTICATED" error
- This indicates the service account key is invalid, expired, or lacks permissions

## Troubleshooting

### Error: 16 UNAUTHENTICATED
This error means the service account credentials are invalid. Check:

1. **Service Account Key Validity**: The key may be expired or deleted
2. **IAM Permissions**: Service account needs `roles/firestore.user` role
3. **API Enablement**: Cloud Firestore API must be enabled
4. **Key Format**: Private key must contain actual newlines (not `\n`)

### Error: Firebase shows as "Disabled or misconfigured"
This means client-side Firebase is not properly configured. Check:

1. **NEXT_PUBLIC_ENABLE_FIREBASE**: Must be set to "true"
2. **All NEXT_PUBLIC_FIREBASE_* variables**: Must be set to actual values (not placeholders)
3. **Build Process**: Client env vars are inlined at build time - rebuild required after changes

## Testing

Use the diagnostic endpoint to verify configuration:
```bash
curl https://your-app.vercel.app/api/admin/firebase-diagnostics
```

Expected response for working configuration:
```json
{
  "env": {
    "PROJECT_ID": "set",
    "SERVICE_ACCOUNT_KEY": "set",
    "NEXT_PUBLIC_ENABLE_FIREBASE": "true"
  },
  "credential": {
    "projectIdFromKey": "your-project-id",
    "clientEmailFromKey": "firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com",
    "keyParseable": true
  },
  "admin": {
    "initialized": true,
    "firestorePing": "ok"
  },
  "errors": []
}
```
