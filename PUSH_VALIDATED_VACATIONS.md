# Push Existing Validated Vacations to Google Calendar

## Quick Method: Use Admin UI

1. Go to the admin vacation requests page
2. Click the **"Sync to Calendar"** button
3. The sync will automatically:
   - Find all approved/validated vacation requests
   - Check which ones don't have calendar events yet
   - Create Google Calendar events for those requests
   - Store the event IDs in Firestore

## Alternative: Use API Endpoint Directly

### From Browser Console (on the admin page)

```javascript
fetch('/api/sync/approved-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('Sync Result:', data);
  if (data.errors && data.errors.length > 0) {
    console.warn('Some requests failed:', data.errors);
  }
});
```

### From Terminal (if you have access to the server)

```bash
curl -X POST https://vacation.stars.mc/api/sync/approved-requests \
  -H "Content-Type: application/json"
```

## What Gets Synced?

The sync process will:

1. ✅ Find all vacation requests with status:
   - `approved`
   - `validated` (treated as approved)
   - `approve`, `ok`, `accepted` (also normalized to approved)

2. ✅ Check which ones don't have a calendar event ID yet:
   - Checks `calendarEventId` field
   - Also checks legacy fields: `googleCalendarEventId`, `googleEventId`

3. ✅ Create Google Calendar events for those requests:
   - Event title: `{userName} - {company}`
   - All-day events from startDate to endDate
   - Company-specific colors
   - Includes description with vacation details

4. ✅ Store the calendar event ID in Firestore:
   - Updates the `calendarEventId` field
   - Prevents duplicate events on future syncs

## Expected Response

```json
{
  "success": true,
  "totalApproved": 10,
  "synced": 8,
  "failed": 2,
  "errors": [
    {
      "id": "request-id",
      "error": "Error message",
      "serviceAccount": "vacation-db@holiday-461710.iam.gserviceaccount.com"
    }
  ],
  "message": "Successfully synced 8 out of 10 approved vacation requests to Google Calendar"
}
```

## Troubleshooting

### If sync fails with permission errors:

1. Check `/api/calendar/diagnostic` to verify service account configuration
2. Ensure the service account has "Make changes to events" permission on the calendar
3. Verify the calendar ID is correct: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

### If some requests fail:

- Check the `errors` array in the response
- Each error includes the request ID and error message
- Common issues:
  - Missing required fields (userName, startDate, endDate)
  - Calendar permission issues
  - Invalid date formats

## Notes

- The sync is **idempotent**: running it multiple times won't create duplicate events
- Only requests without existing calendar event IDs are synced
- The sync respects the current service account configuration (canonical or alternative)

