# Firebase Setup Documentation

## Required IAM Permissions

The Firebase service account needs the following permissions to access Firestore:

### Role Assignment
```bash
gcloud projects add-iam-policy-binding stars-vacation-management \
  --member="serviceAccount:firebase-adminsdk-02ccd335@stars-vacation-management.iam.gserviceaccount.com" \
  --role="roles/firestore.user"
```

### Required APIs
Ensure the following APIs are enabled in the Google Cloud Console:
- Cloud Firestore API
- Firebase Admin API

### Service Account Key Format
The `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable should contain a JSON string with:
- `type`: "service_account"
- `project_id`: "stars-vacation-management"
- `private_key_id`: The key ID
- `private_key`: The private key (with actual newlines, not \n)
- `client_email`: "firebase-adminsdk-xxxxx@stars-vacation-management.iam.gserviceaccount.com"
- `client_id`: The client ID
- `auth_uri`: "https://accounts.google.com/o/oauth2/auth"
- `token_uri`: "https://oauth2.googleapis.com/token"
- `auth_provider_x509_cert_url`: "https://www.googleapis.com/oauth2/v1/certs"
- `client_x509_cert_url`: The certificate URL

### Troubleshooting

#### Error: 16 UNAUTHENTICATED
This error indicates invalid credentials. Check:
1. Service account key is valid and not expired
2. Service account has `roles/firestore.user` permission
3. Cloud Firestore API is enabled
4. Private key contains actual newlines (not `\n`)

#### Error: Invalid FIREBASE_SERVICE_ACCOUNT_KEY format
This error indicates JSON parsing issues. Check:
1. Key is properly escaped in environment variable
2. No extra quotes around the JSON string
3. All required fields are present

### Testing
Use the diagnostic endpoint to verify configuration:
```bash
curl https://your-app.vercel.app/api/admin/firebase-diagnostics
```

Expected response:
```json
{
  "env": {
    "PROJECT_ID": "set",
    "SERVICE_ACCOUNT_KEY": "set"
  },
  "credential": {
    "projectIdFromKey": "stars-vacation-management",
    "clientEmailFromKey": "firebase-adminsdk-xxxxx@stars-vacation-management.iam.gserviceaccount.com",
    "keyParseable": true
  },
  "admin": {
    "initialized": true,
    "firestorePing": "ok"
  },
  "errors": []
}
```
