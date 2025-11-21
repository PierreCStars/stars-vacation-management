# Fix Missing Calendar Events for Validated Vacations

## Problem

Some validated vacations don't appear in Google Calendar even though they're approved. This can happen due to:

1. **Missing Event ID**: The vacation request is approved but no calendar event was created
2. **Stale Event ID**: An event ID exists in Firestore but the event was deleted from Google Calendar
3. **Failed Initial Sync**: The event creation failed during the initial sync but the error wasn't handled properly

## Solution

### Method 1: Check and Fix Specific Request (Recommended)

Use the new diagnostic endpoint to check a specific vacation request:

#### Check Status
```bash
# Replace [ID] with the vacation request ID (e.g., F0lw1VW9jtsyQQdD7Y10)
curl https://vacation.stars.mc/api/sync/request/F0lw1VW9jtsyQQdD7Y10
```

Or in browser console (on the admin page):
```javascript
fetch('/api/sync/request/F0lw1VW9jtsyQQdD7Y10')
  .then(r => r.json())
  .then(data => {
    console.log('Status:', data);
    console.log('Needs Sync:', data.syncStatus?.needsSync);
    console.log('Needs Recreate:', data.syncStatus?.needsRecreate);
  });
```

#### Force Sync
```bash
# Force sync the specific request
curl -X POST https://vacation.stars.mc/api/sync/request/F0lw1VW9jtsyQQdD7Y10
```

Or in browser console:
```javascript
fetch('/api/sync/request/F0lw1VW9jtsyQQdD7Y10', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  if (data.success) {
    console.log('✅ Synced! Event ID:', data.eventId);
  } else {
    console.error('❌ Failed:', data.error);
  }
});
```

### Method 2: Sync All Missing Requests

Use the bulk sync endpoint to sync all approved requests that don't have calendar events:

```bash
curl -X POST https://vacation.stars.mc/api/sync/approved-requests
```

Or use the "Sync to Calendar" button in the admin UI.

## What the Fix Does

### For Specific Request Endpoint (`/api/sync/request/[id]`)

**GET Request** - Diagnostic:
- Checks if request exists
- Verifies status (approved/validated)
- Checks for event ID in Firestore
- Verifies if event exists in Google Calendar
- Returns detailed sync status

**POST Request** - Force Sync:
- Validates request is approved/validated
- Clears stale event IDs if event doesn't exist in calendar
- Creates or updates the calendar event
- Stores the event ID in Firestore

### Improved Sync Logic

The sync service now:
1. **Checks all event ID fields** for backward compatibility:
   - `calendarEventId` (primary)
   - `googleCalendarEventId` (legacy)
   - `googleEventId` (legacy)

2. **Verifies events exist** before skipping creation:
   - If event ID exists in Firestore, verifies it exists in Google Calendar
   - If event is missing (404), clears stale ID and creates new event
   - Prevents false positives where event ID exists but event was deleted

3. **Handles stale event IDs**:
   - Detects when event ID exists but event doesn't
   - Automatically clears stale IDs
   - Creates new events for missing ones

## Example: Fixing Request F0lw1VW9jtsyQQdD7Y10

### Step 1: Check Status
```bash
curl https://vacation.stars.mc/api/sync/request/F0lw1VW9jtsyQQdD7Y10
```

Expected response:
```json
{
  "id": "F0lw1VW9jtsyQQdD7Y10",
  "status": "validated",
  "normalizedStatus": "approved",
  "isApproved": true,
  "hasEventId": false,
  "eventId": null,
  "syncStatus": {
    "needsSync": true,
    "needsRecreate": false,
    "isSynced": false
  }
}
```

### Step 2: Force Sync
```bash
curl -X POST https://vacation.stars.mc/api/sync/request/F0lw1VW9jtsyQQdD7Y10
```

Expected response:
```json
{
  "success": true,
  "id": "F0lw1VW9jtsyQQdD7Y10",
  "eventId": "abc123xyz...",
  "message": "Successfully synced vacation request to Google Calendar (Event ID: abc123xyz...)"
}
```

## Troubleshooting

### Error: "Vacation request is not approved"
- The request status must be `approved`, `validated`, `approve`, `ok`, or `accepted`
- Check the request status in Firestore or admin UI

### Error: "Missing required fields"
- The request must have `startDate` and `endDate`
- Check the request data in Firestore

### Error: "Calendar permission denied"
- Check `/api/calendar/diagnostic` to verify service account configuration
- Ensure service account has "Make changes to events" permission on the calendar
- See `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CONFIG.md` for details

### Event Still Not Appearing
1. Check the event ID was stored in Firestore:
   ```javascript
   // In browser console on admin page
   fetch('/api/vacation-requests')
     .then(r => r.json())
     .then(requests => {
       const req = requests.find(r => r.id === 'F0lw1VW9jtsyQQdD7Y10');
       console.log('Event ID:', req.calendarEventId);
     });
   ```

2. Verify event exists in Google Calendar:
   - Go to Google Calendar
   - Search for the event by user name and dates
   - Check the calendar: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

3. Check server logs for sync errors:
   - Look for `[CALENDAR]` log entries
   - Check for permission errors or API failures

## Prevention

The improved sync logic now:
- ✅ Verifies events exist before skipping creation
- ✅ Detects and fixes stale event IDs automatically
- ✅ Handles all event ID field variations
- ✅ Provides detailed diagnostic information

Future syncs should automatically detect and fix these issues.

