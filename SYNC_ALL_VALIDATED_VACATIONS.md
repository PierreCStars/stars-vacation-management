# Sync All Validated Vacations to Google Calendar

## Quick Method: Browser Console

1. Go to `https://vacation.stars.mc/admin/vacation-requests`
2. Open browser console (F12)
3. Run this command:

```javascript
fetch('/api/sync/approved-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sync Complete!');
  console.log('Total Approved:', data.totalApproved);
  console.log('Synced:', data.synced);
  console.log('Already Synced:', data.skipped);
  console.log('Failed:', data.failed);
  if (data.errors && data.errors.length > 0) {
    console.warn('Errors:', data.errors);
  }
});
```

## What It Does

The sync endpoint will:
1. ✅ Find **ALL** validated/approved vacation requests (not just recent ones)
2. ✅ For each request, call `syncEventForRequest` which:
   - Checks if event ID exists in Firestore
   - Verifies the event actually exists in Google Calendar
   - Clears stale event IDs if events are missing
   - Creates new events for requests that need them
   - Updates events if dates have changed
   - Skips requests that already have valid events

## Response Format

```json
{
  "success": true,
  "totalApproved": 25,
  "synced": 8,
  "skipped": 15,
  "failed": 2,
  "errors": [
    {
      "id": "request-id",
      "error": "Error message",
      "serviceAccount": "service-account@example.com"
    }
  ],
  "message": "Successfully synced 8 out of 25 approved vacation requests to Google Calendar (15 already synced)"
}
```

## Alternative: Admin UI Button

If available, click the **"Sync to Calendar"** button on the admin vacation requests page.

## Notes

- The sync is **idempotent** - safe to run multiple times
- Only creates events for requests that need them
- Automatically handles stale event IDs
- Uses the same logic as the validation flow for consistency

