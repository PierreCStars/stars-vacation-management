# Fix Calendar Write Permissions

## Problem
You're seeing this error:
```
You need to have writer access to this calendar.
```

This means the Google Calendar service account doesn't have write permissions to the target calendar.

## Quick Fix Steps

### Step 1: Identify the Service Account Email

The service account email is:
```
vacation-db@holiday-461710.iam.gserviceaccount.com
```

### Step 2: Identify the Target Calendar

The target calendar ID is:
```
c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
```

### Step 3: Grant Write Permissions

1. **Go to Google Calendar**: https://calendar.google.com/

2. **Find the target calendar**:
   - Look for the calendar with ID: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
   - Or look for a calendar named "Holidays" or "Validated Holidays"

3. **Open Calendar Settings**:
   - Click the **three dots (⋮)** next to the calendar name
   - Select **"Settings and sharing"**

4. **Share with Service Account**:
   - Scroll down to **"Share with specific people"**
   - Click **"Add people"**
   - Enter the service account email:
     ```
     vacation-db@holiday-461710.iam.gserviceaccount.com
     ```
   - Set permission to: **"Make changes to events"** (Writer permission)
   - **Important**: Do NOT check "Send notification" (service accounts don't have email)
   - Click **"Send"** (or "Add" if notification is disabled)

5. **Verify Permissions**:
   - The service account should now appear in the "Share with specific people" list
   - Permission should show as "Make changes to events"

### Step 4: Test the Fix

After granting permissions, try syncing again:

1. Go to the admin vacation requests page
2. Click the **"Sync to Calendar"** button
3. The sync should now succeed

## Alternative: Check Current Permissions

If you're not sure which calendar needs permissions, you can check the environment variable:

**In Vercel**:
1. Go to Project Settings → Environment Variables
2. Look for `GOOGLE_CALENDAR_TARGET_ID` or `GOOGLE_CALENDAR_ID`
3. Use that calendar ID in Step 2 above

## Troubleshooting

### "Calendar not found"
- Verify the calendar ID is correct
- Make sure you're logged into the correct Google account that owns the calendar

### "Permission denied" after adding
- Wait a few minutes for permissions to propagate
- Try the sync again
- Double-check the service account email is correct

### "Service account not found"
- Verify the service account exists in Google Cloud Console
- Check that the email matches exactly: `vacation-db@holiday-461710.iam.gserviceaccount.com`

## Verification

After granting permissions, you should see:
- ✅ Sync completes without errors
- ✅ Calendar events are created in the target calendar
- ✅ No "writer access" errors in the console

## Related Documentation

- See `docs/calendars.md` for complete calendar configuration
- See `GOOGLE_CALENDAR_SYNC_FIX.md` for other calendar sync issues

