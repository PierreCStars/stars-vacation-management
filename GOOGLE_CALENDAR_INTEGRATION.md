# Google Calendar Integration Setup

This document outlines the complete setup for integrating Google Calendar with the Stars Vacation Management app.

## Overview

The integration provides two-way synchronization:
1. **Calendar A (Target)**: Approved vacations are automatically written to this calendar
2. **Calendar B (Source)**: Events are imported from this calendar into the app

## Environment Variables

Create/update your `.env.local` file with the following variables:

```bash
# Google Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_KEY={"client_email":"...","private_key":"..."}
# OR use separate variables:
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...multiline...\n-----END PRIVATE KEY-----\n"

# Calendar IDs
GOOGLE_CALENDAR_TARGET_ID=c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
GOOGLE_CALENDAR_SOURCE_ID=c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com

# Timezone
APP_TIMEZONE=Europe/Monaco
```

**Note**: Set the same variables in Vercel Project Settings → Environment Variables for production.

## Google Cloud Console Setup

### 1. Service Account Creation
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "IAM & Admin" → "Service Accounts"
4. Click "Create Service Account"
5. Name: `vacation-calendar-sync`
6. Description: `Service account for vacation management calendar sync`
7. Click "Create and Continue"
8. Skip role assignment (we'll do this manually)
9. Click "Done"

### 2. Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Download the key file
6. Copy the contents to your `.env.local` as `GOOGLE_SERVICE_ACCOUNT_KEY`

### 3. Calendar Permissions
1. **Calendar A (Target)**: Share with service account email
   - Permission: "Make changes to events"
   - This allows writing approved vacations

2. **Calendar B (Source)**: Share with service account email
   - Permission: "See all event details"
   - This allows reading events for import

### 4. Enable Google Calendar API
1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

## Features

### 1. Vacation Approval → Calendar A
When a vacation request is approved:
- Creates/updates event in Calendar A
- Supports full-day and half-day events
- Uses Europe/Monaco timezone
- Idempotent operations (no duplicates)

**Half-day timing:**
- Morning: 09:00 - 13:00
- Afternoon: 14:00 - 18:00

### 2. Calendar B Import
- Incremental sync using Google's syncToken
- Automatic recovery from expired tokens
- Handles deletions and cancellations
- Stores events in Firestore for app display

### 3. Conflict Resolution
- App-internal approved vacations take precedence
- External events are read-only
- iCalUID-based deduplication
- Visual conflict indicators in UI

## API Endpoints

### Manual Sync
- `GET /api/sync/import-remote` - Trigger Calendar B import

### Admin Endpoints
- `GET /api/admin/calendar-sync/state` - Get sync status
- `GET /api/admin/calendar-sync/logs` - Get sync logs

## Admin Interface

Access the sync administration at `/admin/calendar-sync` to:
- View current sync status
- Trigger manual syncs
- Monitor sync logs
- View error details

## Vercel Cron (Optional)

Set up automatic sync every 30 minutes during business hours:

```json
{
  "crons": [
    {
      "path": "/api/sync/import-remote",
      "schedule": "*/30 7-20 * * 1-6"
    }
  ]
}
```

Schedule: Every 30 minutes, 07:00-20:00, Monday-Saturday

## Testing

### 1. Test Vacation Approval
1. Approve a vacation request
2. Check Calendar A for the event
3. Verify timing and details

### 2. Test Calendar B Import
1. Add test event to Calendar B
2. Call `/api/sync/import-remote`
3. Check admin page for sync results
4. Verify event appears in app calendar

### 3. Test Conflict Resolution
1. Create internal vacation with same dates as external event
2. Verify internal vacation takes precedence
3. Check for visual conflict indicators

## Troubleshooting

### Common Issues

1. **"Missing Google service account env vars"**
   - Check environment variables are set correctly
   - Verify private key has proper newline escaping

2. **"Calendar not found"**
   - Verify calendar IDs are correct
   - Check service account has access to both calendars

3. **"Insufficient permissions"**
   - Ensure service account has proper calendar permissions
   - Check calendar sharing settings

4. **Sync token expired (410 GONE)**
   - This is normal and handled automatically
   - System will perform full resync and get new token

### Debug Steps

1. Check browser console for errors
2. Verify environment variables in Vercel
3. Test service account permissions manually
4. Check Firestore for sync logs and state

## Security Notes

- Service account credentials are stored in environment variables
- No secrets are committed to the repository
- Calendar B is read-only (no write access)
- All operations are logged for audit purposes

## Performance

- Incremental sync uses syncToken for efficiency
- Full resync only happens when token expires
- Events are cached in Firestore for fast UI rendering
- Sync operations are asynchronous and non-blocking
