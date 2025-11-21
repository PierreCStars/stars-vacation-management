# How to Use the Browser Script to Diagnose and Fix Calendar Sync Issues

## Quick Start

The browser script (`fix-calendar-event-script.js`) is a diagnostic tool that checks vacation request calendar sync status and can automatically fix issues.

## Step-by-Step Instructions

### 1. Get the Vacation Request ID

You need the ID of the vacation request you want to diagnose. You can find it:
- In the admin vacation requests page URL
- In the browser console when viewing a request
- From the Firestore database

### 2. Open the Browser Console

1. Navigate to your vacation management app (e.g., `https://vacation.stars.mc/admin/vacation-requests`)
2. Open the browser developer console:
   - **Chrome/Edge**: Press `F12` or `Ctrl+Shift+J` (Windows) / `Cmd+Option+J` (Mac)
   - **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
   - **Safari**: Enable Developer menu first, then `Cmd+Option+C`

### 3. Customize and Run the Script

1. Open `fix-calendar-event-script.js` in your editor
2. **Change the request ID** on line 5:
   ```javascript
   const requestId = 'YOUR_REQUEST_ID_HERE';  // Replace with actual ID
   ```
3. Copy the entire script (all 149 lines)
4. Paste it into the browser console
5. Press `Enter` to run it

### 4. Review the Diagnostic Output

The script will display detailed information:

#### Request Information
- ✅ **ID**: The vacation request ID
- ✅ **Status**: Current status (pending, approved, validated, etc.)
- ✅ **Is Approved**: Whether the request is in an approved state
- ✅ **Has Event ID**: Whether a calendar event ID is stored
- ✅ **Event ID**: The actual Google Calendar event ID (if exists)
- ✅ **Calendar Event Exists**: Whether the event actually exists in Google Calendar

#### Calendar Event Details (if event exists)
- Summary, start/end dates
- Event status and visibility
- Direct link to the event in Google Calendar

#### Sync Status
- **Needs Sync**: Event needs to be created
- **Needs Recreate**: Event ID exists but event is missing
- **Is Synced**: Everything is properly synced
- **Can Force Recreate**: Whether you can force recreate the event

### 5. Automatic Fix (if needed)

The script will automatically attempt to fix issues if:
- The request is approved but missing a calendar event
- The event ID exists but the event is missing from Google Calendar

If the request is not approved, the script will tell you to approve it first.

### 6. Manual Force Sync (if needed)

If the automatic fix didn't work, or you want to force recreate an event, use the global function:

```javascript
// Force sync (recreates if event exists)
await forceSync('YOUR_REQUEST_ID', false);

// Force recreate (deletes old event and creates new one)
await forceSync('YOUR_REQUEST_ID', true);
```

## What the Script Does

### Diagnostic Phase (GET Request)
1. Fetches vacation request data from Firestore
2. Checks if request is approved/validated
3. Verifies if calendar event ID exists in database
4. Checks if the event actually exists in Google Calendar
5. Determines what action is needed

### Fix Phase (POST Request)
1. Validates the request is approved
2. Clears stale event IDs if event doesn't exist
3. Creates or updates the calendar event in Google Calendar
4. Stores the event ID in Firestore
5. Returns success status and event details

## Common Scenarios

### Scenario 1: Missing Event (No Event ID)
**Symptoms**: Request is approved but no calendar event exists

**What script does**:
- Detects `needsSync: true`
- Automatically creates the calendar event
- Stores the new event ID

**Output**:
```
🔄 Event needs to be created...
✅ SUCCESS!
 Event ID: abc123xyz...
📅 The event should now appear in Google Calendar!
```

### Scenario 2: Stale Event ID
**Symptoms**: Event ID exists in database but event was deleted from calendar

**What script does**:
- Detects `needsRecreate: true`
- Clears the stale event ID
- Creates a new calendar event
- Updates the event ID in database

**Output**:
```
🔄 Event ID exists but event is missing, recreating...
✅ SUCCESS!
 Cleared Stale Event ID: Yes
 Event ID: new123xyz...
```

### Scenario 3: Already Synced
**Symptoms**: Everything is working correctly

**What script does**:
- Confirms sync status
- Provides event link for verification
- Offers option to force recreate if needed

**Output**:
```
✅ Request is already synced!
🔗 Event Link: https://calendar.google.com/calendar/event?eid=...
💡 If the event is not visible in the calendar:
   1. Check if you have access to the calendar
   2. Check if the event is on the correct calendar
   3. Try force recreating with: await forceSync('ID', true)
```

### Scenario 4: Not Approved
**Symptoms**: Request status is not approved/validated

**What script does**:
- Stops execution
- Tells you to approve the request first

**Output**:
```
⚠️ Request is not approved/validated
 Status: pending
 → Approve the request first, then sync
```

## Troubleshooting

### Error: "Vacation request is not approved"
**Solution**: Approve the request in the admin UI first, then run the script again.

### Error: "Missing required fields"
**Solution**: Ensure the request has `startDate` and `endDate` fields in Firestore.

### Error: "Calendar permission denied"
**Solution**: 
1. Check service account permissions: Visit `/api/calendar/diagnostic`
2. Ensure service account has "Make changes to events" permission on the calendar
3. See `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CONFIG.md` for setup details

### Event Created But Not Visible
1. **Check the calendar**: Verify you're looking at the correct calendar
   - Calendar ID is shown in the diagnostic output
2. **Check event link**: Click the event link provided in the output
3. **Refresh calendar**: Google Calendar may need a refresh to show new events
4. **Check permissions**: Ensure you have access to view the calendar

### Script Doesn't Run
1. **Check console errors**: Look for JavaScript errors in the console
2. **Verify you're logged in**: Make sure you're authenticated
3. **Check network tab**: Verify API requests are being made
4. **Try manual API call**: Test the endpoint directly:
   ```javascript
   fetch('/api/sync/request/YOUR_ID')
     .then(r => r.json())
     .then(console.log);
   ```

## Advanced Usage

### Diagnose Multiple Requests

You can modify the script to check multiple requests:

```javascript
const requestIds = ['ID1', 'ID2', 'ID3'];

for (const requestId of requestIds) {
  console.log(`\n=== Checking ${requestId} ===`);
  // Copy the diagnostic logic from the script
  const checkResponse = await fetch(`/api/sync/request/${requestId}`);
  const checkData = await checkResponse.json();
  console.log(checkData);
}
```

### Batch Force Sync

To force sync multiple requests:

```javascript
const requestIds = ['ID1', 'ID2', 'ID3'];

for (const requestId of requestIds) {
  console.log(`Syncing ${requestId}...`);
  await forceSync(requestId, false);
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
}
```

## Related Documentation

- `FIX_MISSING_CALENDAR_EVENTS.md` - General troubleshooting guide
- `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CONFIG.md` - Service account setup
- `VERIFY_CALENDAR_PERMISSIONS.md` - Permission verification

## API Endpoints Used

- `GET /api/sync/request/[id]` - Diagnostic endpoint
- `POST /api/sync/request/[id]` - Force sync endpoint
- `POST /api/sync/request/[id]?force=true` - Force recreate endpoint

