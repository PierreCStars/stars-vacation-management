# Gmail API Setup Guide

This guide will help you set up Gmail API to send emails from your vacation management app.

## Step 1: Enable Gmail API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (holiday-461710)
3. Go to "APIs & Services" > "Library"
4. Search for "Gmail API"
5. Click on "Gmail API" and press "Enable"

## Step 2: Update Service Account Permissions

1. Go to "APIs & Services" > "Credentials"
2. Find your service account (vacation-db@holiday-461710.iam.gserviceaccount.com)
3. Click on it to edit
4. Go to the "Permissions" tab
5. Add the following roles:
   - Gmail API > Gmail API Admin
   - Gmail API > Gmail API User

## Step 3: Set Up Domain-Wide Delegation (Recommended)

For better email delivery, set up domain-wide delegation:

1. In your service account, go to "Keys" tab
2. Create a new key (JSON format) if you haven't already
3. Note the `client_email` from the JSON
4. Go to your Google Workspace Admin Console
5. Navigate to Security > API Controls > Domain-wide Delegation
6. Add a new API client with:
   - Client ID: [your-service-account-client-id]
   - OAuth Scopes: `https://www.googleapis.com/auth/gmail.send`

## Step 4: Update Environment Variables

Add these to your `.env` file:

```env
# Gmail Configuration
GMAIL_FROM_EMAIL=your-email@stars.mc
```

## Step 5: Test the Setup

1. Restart your development server
2. Submit a vacation request
3. Check the console logs for Gmail API status
4. Verify emails are sent to johnny@stars.mc and daniel@stars.mc

## Troubleshooting

### If emails don't send:
1. Check that Gmail API is enabled
2. Verify service account has correct permissions
3. Ensure domain-wide delegation is set up
4. Check console logs for specific error messages

### For production:
1. Use a verified domain email address
2. Set up proper SPF/DKIM records
3. Consider using Google Workspace for better deliverability

## Benefits of Gmail API over Resend:

✅ **No domain verification required** for sending to any email  
✅ **Better deliverability** through Google's infrastructure  
✅ **No sending limits** for reasonable usage  
✅ **Integrated with your existing Google Cloud setup**  
✅ **Free tier** with generous limits 