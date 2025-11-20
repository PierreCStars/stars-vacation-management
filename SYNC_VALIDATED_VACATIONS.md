# Sync Validated/Approved Vacations to Google Calendar

This guide explains how to push existing validated/approved vacation requests to Google Calendar.

## Method 1: Using the API Endpoint (Recommended)

The easiest way to sync validated vacations is to call the API endpoint:

### Production (Deployed)

```bash
curl -X POST https://vacation.stars.mc/api/sync/approved-requests
```

Or use the helper script:

```bash
./scripts/call-sync-api.sh production
```

### Local Development

```bash
# Make sure your dev server is running first
npm run dev

# Then in another terminal:
curl -X POST http://localhost:3000/api/sync/approved-requests
```

Or use the helper script:

```bash
./scripts/call-sync-api.sh local
```

## Method 2: Using the TypeScript Script

If you have local environment variables set up:

```bash
npx tsx scripts/sync-validated-vacations.ts
```

**Note**: This requires:
- `NEXT_PUBLIC_ENABLE_FIREBASE=true` in your `.env.local`
- Firebase Admin credentials configured
- Google Calendar service account key configured

## Method 3: Using the Node.js Script

```bash
node sync-approved-requests.cjs
```

**Note**: This requires the same environment variables as Method 2.

## What Gets Synced?

The sync process will:

1. ✅ Find all vacation requests with status "approved" or "validated" (both are treated as approved)
2. ✅ Check which ones don't have a calendar event ID yet
3. ✅ Create Google Calendar events for those requests
4. ✅ Store the calendar event ID in Firestore for future reference

## Status Normalization

The system normalizes various status values to "approved":
- `approved`, `approve`, `ok`, `accepted`, **`validated`** → treated as approved

## Event ID Fields

The system checks for calendar events in these fields (for backward compatibility):
- `calendarEventId` (primary)
- `googleCalendarEventId` (legacy)
- `googleEventId` (legacy)

## API Response

The API endpoint returns a JSON response:

```json
{
  "success": true,
  "totalApproved": 10,
  "synced": 8,
  "failed": 2,
  "errors": [
    {
      "id": "request-id",
      "error": "Error message"
    }
  ],
  "message": "Successfully synced 8 out of 10 approved vacation requests to Google Calendar"
}
```

## Troubleshooting

### Firebase Admin not available
- Make sure `NEXT_PUBLIC_ENABLE_FIREBASE=true` is set
- Verify Firebase Admin credentials are configured

### Calendar permission denied
- Ensure the Google Calendar service account has write access to the target calendar
- Check that `GOOGLE_CALENDAR_TARGET_ID` is set correctly

### No requests to sync
- All approved/validated requests already have calendar events
- Check the logs to see which requests were skipped

