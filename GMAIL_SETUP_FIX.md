# Gmail API Setup Fix Guide

This guide will help you fix the Gmail API configuration issues and get email notifications working.

## Current Issues

The logs show these errors:
- `error:1E08010C:DECODER routines::unsupported` - Service account key format issue
- `The incoming JSON object does not contain a client_email field` - Malformed JSON

## Step 1: Regenerate Service Account Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Click on it and go to "Keys" tab
5. **Delete any existing keys** (they may be corrupted)
6. Click "Add Key" > "Create new key"
7. Choose "JSON" format
8. Download the new key file

## Step 2: Use the Helper Script

1. Place your downloaded JSON file in the project directory
2. Update the filename in `fix-gmail-config.js`:
   ```javascript
   const keyFileName = 'your-downloaded-file.json'; // Change this
   ```
3. Run the script:
   ```bash
   node fix-gmail-config.js
   ```
4. Copy the output and add it to your `.env` file

## Step 3: Update Environment Variables

Add these to your `.env` file:

```env
# Google Service Account (use output from the script)
GOOGLE_SERVICE_ACCOUNT_KEY="{\"type\":\"service_account\",\"project_id\":\"...\",\"private_key_id\":\"...\",\"private_key\":\"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n\",\"client_email\":\"vacation-db@holiday-461710.iam.gserviceaccount.com\",\"client_id\":\"...\",\"auth_uri\":\"https://accounts.google.com/o/oauth2/auth\",\"token_uri\":\"https://oauth2.googleapis.com/token\",\"auth_provider_x509_cert_url\":\"https://www.googleapis.com/oauth2/v1/certs\",\"client_x509_cert_url\":\"https://www.googleapis.com/robot/v1/metadata/x509/vacation-db%40holiday-461710.iam.gserviceaccount.com\"}"

# Google Sheets
GOOGLE_SHEET_ID=your-sheet-id-here

# Gmail Configuration
GMAIL_FROM_EMAIL=pierre@stars.mc
```

## Step 4: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Library"
3. Search for "Gmail API"
4. Click on it and press "Enable"

## Step 5: Set Up Domain-Wide Delegation (Recommended)

For better email delivery:

1. In your service account, go to "Keys" tab
2. Note the `client_email` from the JSON
3. Go to your Google Workspace Admin Console
4. Navigate to Security > API Controls > Domain-wide Delegation
5. Add a new API client with:
   - Client ID: [your-service-account-client-id]
   - OAuth Scopes: `https://www.googleapis.com/auth/gmail.send`

## Step 6: Test the Configuration

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the console logs for:
   ```
   ✅ Service account key parsed successfully
   📧 Client email: vacation-db@holiday-461710.iam.gserviceaccount.com
   ✅ Gmail API initialized successfully
   ```

3. Submit a vacation request and check for:
   ```
   === GMAIL EMAIL DEBUG INFO ===
   Gmail API configured: true
   To: johnny@stars.mc, daniel@stars.mc, pierre@stars.mc
   ```

## Troubleshooting

### If you still get crypto errors:
- Make sure you're using a fresh service account key
- The private key should start with `-----BEGIN PRIVATE KEY-----`
- Check that the JSON is properly escaped in the `.env` file

### If Gmail API is not enabled:
- Go to Google Cloud Console > APIs & Services > Library
- Search for "Gmail API" and enable it

### If emails don't send:
- Check that domain-wide delegation is set up
- Verify the `GMAIL_FROM_EMAIL` is set to your email
- Check the console logs for specific error messages

## Manual Key Formatting (Alternative)

If the script doesn't work, manually format your key:

1. Open your downloaded JSON file
2. Copy the entire content
3. In your `.env` file, add:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"vacation-db@holiday-461710.iam.gserviceaccount.com",...}'
   ```

**Important**: Make sure to:
- Use single quotes around the entire JSON
- Escape any quotes inside the JSON
- Keep the `\n` characters in the private key

## Success Indicators

When everything is working correctly, you should see:
- ✅ Service account key parsed successfully
- ✅ Gmail API initialized successfully
- ✅ Emails sent to all three recipients
- No crypto or JSON parsing errors 