# Google Calendar Integration Setup Guide

## Problem
Vacation requests are being approved but not automatically added to the Google Calendar because the Google Calendar API is not properly configured.

## Solution
You need to set up Google Calendar API credentials and add them to your environment variables.

## Step-by-Step Setup

### 1. Create a Google Cloud Project (if you don't have one)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Calendar API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

### 2. Create a Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Fill in the details:
   - Name: `stars-vacation-calendar`
   - Description: `Service account for Stars vacation calendar integration`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### 3. Generate Service Account Key
1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create New Key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Share the Calendar
1. Go to [Google Calendar](https://calendar.google.com/)
2. Find the Stars vacation calendar: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
3. Click the three dots next to the calendar name
4. Select "Settings and sharing"
5. Scroll down to "Share with specific people"
6. Add the service account email (found in the JSON file) with "Make changes to events" permission

### 5. Add Environment Variables
Add these to your `.env` file:

```bash
# Google Calendar Integration
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"stars-vacation-calendar@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/stars-vacation-calendar%40your-project-id.iam.gserviceaccount.com"}
GOOGLE_CALENDAR_ID=c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
```

**Important**: Replace the entire JSON content from the downloaded service account key file.

### 6. Test the Integration
After setting up the environment variables:

1. Restart your development server
2. Approve a vacation request
3. Check the console logs for calendar integration messages
4. Verify the event appears in the Google Calendar

## Troubleshooting

### Common Issues:

1. **"Invalid Credentials" Error**
   - Make sure the service account JSON is properly formatted in the environment variable
   - Ensure the service account has access to the calendar

2. **"Calendar Not Found" Error**
   - Verify the calendar ID is correct
   - Make sure the service account has been added to the calendar with proper permissions

3. **"Permission Denied" Error**
   - Check that the service account has "Make changes to events" permission on the calendar

### Testing the Setup:

You can test the calendar integration by running:

```bash
node test-calendar-integration.js
```

This will attempt to add a test event to the calendar and verify the setup is working.

## Security Notes

- Keep the service account key secure and never commit it to version control
- Use environment variables in production
- Consider using Google Cloud Secret Manager for production deployments
- Regularly rotate the service account keys

## Next Steps

Once the Google Calendar integration is working:

1. All approved vacation requests will automatically appear in the calendar
2. Events will be color-coded by company
3. The calendar will be visible in the admin interface
4. Users will receive confirmation that their vacation was added to the calendar 