# Gmail API Permissions Fix Guide

## Current Issue
The Gmail API is configured but failing with "Precondition check failed" error. This means the service account doesn't have permission to send emails on behalf of your domain.

## Solution: Set Up Domain-Wide Delegation

### Step 1: Enable Domain-Wide Delegation in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" > "Credentials"
3. Find your service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Click on it and go to the "Keys" tab
5. Click "Add Key" > "Create new key" (if you don't have one)
6. Choose "JSON" format and download

### Step 2: Set Up Domain-Wide Delegation in Google Workspace Admin

1. Go to [Google Workspace Admin Console](https://admin.google.com)
2. Navigate to "Security" > "API Controls" > "Domain-wide Delegation"
3. Click "Add new"
4. Enter the Client ID from your service account JSON file
5. Add these OAuth scopes:
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.compose
   ```
6. Click "Authorize"

### Step 3: Alternative Solution - Use Your Personal Gmail Account

If domain-wide delegation is too complex, you can use your personal Gmail account:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to [Google Account Settings](https://myaccount.google.com)
   - Navigate to "Security" > "2-Step Verification" > "App passwords"
   - Generate a new app password for "Mail"
3. **Update your .env file**:
   ```
   GMAIL_USER_EMAIL=pierre@stars.mc
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```

### Step 4: Test the Configuration

After setting up either method, restart your development server:

```bash
npm run dev
```

Then submit a new vacation request to test email sending.

## Current Status

✅ **Gmail API Configured**: The service is properly initialized
✅ **Email Recipients Updated**: You're included in notifications
❌ **Permissions Issue**: Service account needs domain-wide delegation

## Quick Fix for Testing

For immediate testing, you can temporarily use a simple email service like Resend with a verified domain, or use the console fallback which is currently working (emails are logged to the console).

The console logs show that the email content is being generated correctly:
```
To: johnny@stars.mc, daniel@stars.mc, pierre@stars.mc
Subject: New Vacation Request - Pierre Corbucci
```

This means the email system is working, but the Gmail API permissions need to be configured. 