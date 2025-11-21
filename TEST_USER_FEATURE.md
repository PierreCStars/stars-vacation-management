# Test User Feature

## Overview

The test user feature allows admins to quickly create test vacation requests using `test@stars.mc`. These requests appear in Google Calendar like normal requests but are automatically deleted after 24 hours.

## Features

### 1. Quick-Fill Button

In the "Create Vacation" modal, there's now a yellow banner with a "Fill Test User" button that quickly fills in:
- **First Name**: Test
- **Last Name**: User
- **Phone**: +377 00 00 00 00
- **Email**: test@stars.mc
- **Company**: Stars MC
- **Vacation Type**: Paid Leave

This makes it easy to create test requests without manually entering all the fields.

### 2. Test Request Identification

Test user requests are automatically marked with:
- `isTestUser: true` - Flag to identify test requests
- `testUserCreatedAt: timestamp` - Creation time for cleanup calculation
- Special `adminComment`: "Test request - will be auto-deleted after 24 hours"
- Special `reason`: "Test vacation request (auto-deleted after 24h)"

### 3. Automatic Cleanup

A cron job runs **every hour** to delete test user requests that are older than 24 hours:

- **Schedule**: `0 * * * *` (every hour at minute 0)
- **Endpoint**: `/api/cron/cleanup-test-requests`
- **Process**:
  1. Finds all vacation requests from `test@stars.mc`
  2. Checks if `createdAt` is older than 24 hours
  3. Deletes the Google Calendar event (if it exists)
  4. Deletes the Firestore document

## Configuration

### Environment Variables

- `TEST_USER_CLEANUP_ENABLED`: Set to `'false'` to disable automatic cleanup (default: `true`)

### Vercel Cron

The cleanup cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-test-requests",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Usage

### Creating a Test Request

1. Go to Admin → Vacation Requests
2. Click "Create Vacation" button
3. Click "Fill Test User" button in the yellow banner
4. Fill in the dates
5. Click "Validate & Create"

The request will:
- Be immediately approved (status: approved)
- Appear in Google Calendar
- Be automatically deleted after 24 hours

### Manual Cleanup Trigger

You can manually trigger the cleanup:

```bash
# Via GET
curl https://vacation.stars.mc/api/cron/cleanup-test-requests

# Via POST
curl -X POST https://vacation.stars.mc/api/cron/cleanup-test-requests
```

Or in browser console:
```javascript
fetch('/api/cron/cleanup-test-requests', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log('Cleanup result:', data));
```

## Response Format

The cleanup endpoint returns:

```json
{
  "success": true,
  "message": "Deleted 3 test user vacation requests",
  "deleted": 3,
  "errors": 0,
  "timestamp": "2025-01-XXT..."
}
```

## Implementation Details

### Files Modified

1. **`src/components/admin/CreateVacationModal.tsx`**
   - Added yellow banner with "Fill Test User" button
   - Added `fillTestUser()` function to populate form fields

2. **`src/app/api/admin/vacations/route.ts`**
   - Detects `test@stars.mc` email
   - Adds `isTestUser` and `testUserCreatedAt` fields
   - Sets special comments for test requests

3. **`src/app/api/cron/cleanup-test-requests/route.ts`**
   - New cron endpoint for cleanup
   - Queries Firestore for test requests older than 24 hours
   - Deletes calendar events and Firestore documents

4. **`vercel.json`**
   - Added cron job configuration

## Testing

### Test the Quick-Fill

1. Open Create Vacation modal
2. Click "Fill Test User"
3. Verify all fields are populated correctly
4. Add dates and submit
5. Verify request appears in calendar

### Test the Cleanup

1. Create a test request
2. Manually trigger cleanup (should not delete - request is too new)
3. Wait 24+ hours OR manually adjust `createdAt` in Firestore to be 25 hours ago
4. Trigger cleanup again
5. Verify request is deleted from both calendar and Firestore

### Disable Cleanup

Set `TEST_USER_CLEANUP_ENABLED=false` in Vercel environment variables to disable automatic cleanup (useful for testing).

## Notes

- Test requests are **fully functional** - they sync to Google Calendar just like normal requests
- The cleanup only affects requests from `test@stars.mc`
- Calendar events are deleted before Firestore documents
- If calendar deletion fails (e.g., event already deleted), the Firestore document is still deleted
- The cleanup respects the `TEST_USER_CLEANUP_ENABLED` flag

## Troubleshooting

### Cleanup Not Running

1. Check Vercel cron logs
2. Verify `TEST_USER_CLEANUP_ENABLED` is not set to `'false'`
3. Check Firebase Admin is available
4. Verify cron is configured in `vercel.json`

### Test Requests Not Being Deleted

1. Verify request has `userEmail: 'test@stars.mc'`
2. Check `createdAt` is older than 24 hours
3. Review cron endpoint logs for errors
4. Manually trigger cleanup to test

### Calendar Events Not Deleted

- Calendar events are deleted first, then Firestore documents
- If calendar deletion fails (404), it's logged but doesn't stop Firestore deletion
- Check calendar permissions for the service account

