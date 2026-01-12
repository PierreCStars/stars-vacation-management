# Force Sync Vacation Requests to Google Calendar

## Quick Methods to Force Sync

### Method 1: Browser Console (Easiest - Recommended)

1. **Open your app** (local or production):
   - Local: `http://localhost:3000`
   - Production: `https://vacation.stars.mc`

2. **Navigate to Admin page** (if you have access):
   - `/admin/vacation-requests` or `/admin/setup`

3. **Open Browser Console** (F12 or Cmd+Option+I)

4. **Run this command**:
```javascript
fetch('/api/sync/approved-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Sync Complete!');
  console.log('📊 Summary:');
  console.log('   Total Approved:', data.totalApproved);
  console.log('   ✅ Synced:', data.synced);
  console.log('   ⏭️  Already Synced:', data.skipped);
  console.log('   ❌ Failed:', data.failed);
  if (data.errors && data.errors.length > 0) {
    console.warn('❌ Errors:', data.errors);
  }
  console.log('\n💬', data.message);
});
```

### Method 2: Using curl (Production)

If you have access to the production URL:

```bash
curl -X POST https://vacation.stars.mc/api/sync/approved-requests \
  -H "Content-Type: application/json"
```

### Method 3: Admin UI Button

If available in your admin interface:

1. Go to `/admin/setup` or `/admin/vacation-requests`
2. Look for **"Sync to Calendar"** or **"Sync Approved Requests"** button
3. Click it to trigger the sync

### Method 4: Start Local Server and Use Script

If you want to run locally:

1. **Start the development server**:
```bash
npm run dev
```

2. **In another terminal, run the sync script**:
```bash
node force-sync.cjs
```

Or set the URL:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000 node force-sync.cjs
```

---

## What Gets Synced?

The sync process will:

1. ✅ Find **ALL** approved/validated vacation requests
2. ✅ Check which ones don't have calendar events yet
3. ✅ Create Google Calendar events for those requests
4. ✅ Store the event IDs in Firestore
5. ✅ Skip requests that already have valid events

### Status Normalization

The following statuses are treated as "approved":
- `approved`
- `validated`
- `approve`
- `ok`
- `accepted`

---

## Expected Response

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

---

## Sync Individual Request

To sync a specific vacation request:

```javascript
// Replace REQUEST_ID with the actual request ID
fetch('/api/sync/request/REQUEST_ID', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('Sync Result:', data);
});
```

To force recreate (delete and recreate):

```javascript
fetch('/api/sync/request/REQUEST_ID?force=true', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(data => {
  console.log('Force Recreate Result:', data);
});
```

---

## Troubleshooting

### "Connection Refused" Error

**Problem**: Server is not running

**Solution**: 
- For local: Run `npm run dev`
- For production: Check if the app is deployed

### "Firebase Admin not available" Error

**Problem**: Firebase credentials not configured

**Solution**: 
- Check environment variables in Vercel (production)
- Check `.env.local` file (local)
- Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` or Firebase Admin credentials are set

### "Permission Denied" Error

**Problem**: Service account doesn't have write access to calendar

**Solution**:
1. Go to Google Calendar
2. Find the target calendar
3. Settings and sharing → Share with specific people
4. Add service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
5. Set permission: "Make changes to events"
6. Wait 2-5 minutes for permissions to propagate

### "Calendar not found" Error

**Problem**: Calendar ID is incorrect

**Solution**:
- Verify `GOOGLE_CALENDAR_TARGET_ID` environment variable
- Default calendar ID: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

---

## Sync Behavior

- **Idempotent**: Safe to run multiple times
- **Smart**: Only creates events for requests that need them
- **Automatic Cleanup**: Clears stale event IDs if events are missing
- **Update Support**: Updates events if dates have changed

---

## Files Created

- `force-sync.cjs` - Script to call API endpoint
- `force-sync-direct.cjs` - Direct sync script (requires Firebase credentials)
- `FORCE_SYNC_GUIDE.md` - This guide

---

**Recommended Method**: Use **Method 1 (Browser Console)** - it's the easiest and works in both local and production environments.
