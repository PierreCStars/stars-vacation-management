# Fix Missing Calendar Event for Request 9cvcfGrFqicZFNPxkffQ

## Quick Fix Method

### Option 1: Use Browser Console (Easiest)

1. Go to the admin vacation requests page
2. Open browser console (F12)
3. Run this code:

```javascript
// Check status
fetch('/api/sync/request/9cvcfGrFqicZFNPxkffQ')
  .then(r => r.json())
  .then(data => {
    console.log('Status:', data);
    
    if (data.syncStatus?.needsSync || data.syncStatus?.needsRecreate) {
      // Force sync
      return fetch('/api/sync/request/9cvcfGrFqicZFNPxkffQ', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  })
  .then(r => r?.json())
  .then(data => {
    if (data?.success) {
      console.log('✅ Fixed! Event ID:', data.eventId);
    } else {
      console.error('❌ Failed:', data?.error);
    }
  });
```

### Option 2: Use the Sync Button

1. Go to Admin → Vacation Requests
2. Click "Sync to Calendar" button
3. This will sync all validated vacations from the last 30 days, including this one

### Option 3: Direct API Call

```bash
# Check status
curl https://vacation.stars.mc/api/sync/request/9cvcfGrFqicZFNPxkffQ

# Force sync
curl -X POST https://vacation.stars.mc/api/sync/request/9cvcfGrFqicZFNPxkffQ
```

## What to Check

The diagnostic endpoint will tell you:
- ✅ If the request is approved/validated
- ✅ If it has a calendar event ID in Firestore
- ✅ If the event actually exists in Google Calendar
- ✅ What action is needed (sync, recreate, or already synced)

## Common Issues

1. **Stale Event ID**: Event ID exists in Firestore but event was deleted from calendar
   - **Fix**: Force sync will clear the stale ID and create a new event

2. **Missing Event ID**: Request is approved but no event ID stored
   - **Fix**: Force sync will create the event

3. **Not Approved**: Request status is not approved/validated
   - **Fix**: Approve the request first, then sync

4. **Permission Error**: Service account doesn't have calendar permissions
   - **Fix**: Check `/api/calendar/diagnostic` for service account status

