# Verify Calendar Permissions - Troubleshooting Guide

## Current Status ✅

From your screenshot, I can see:
- ✅ Service account `vacation-db@holiday-461710.iam.gserviceaccount.com` is in the list
- ✅ It has **"Make changes to events"** permission
- ✅ This permission level should allow write access

## Why You Might Still See Errors

### 1. Permissions Propagation Delay
Google Calendar permissions can take **2-5 minutes** to fully propagate. If you just added the service account, wait a few minutes and try again.

### 2. Verify the Correct Calendar is Being Used

The app uses the calendar ID from environment variables. Check which calendar ID is actually configured:

**In Vercel:**
1. Go to Project Settings → Environment Variables
2. Look for `GOOGLE_CALENDAR_TARGET_ID` or `GOOGLE_CALENDAR_ID`
3. Verify it matches: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

### 3. Organization-Level Restrictions

Your organization might have restrictions on sharing calendars. Check:
- Google Workspace Admin Console → Security → Access and data control
- Calendar sharing policies

### 4. Service Account Credentials

Verify the service account email in your environment variables matches:
```
vacation-db@holiday-461710.iam.gserviceaccount.com
```

## Quick Diagnostic Steps

### Step 1: Check Calendar Configuration
Visit the diagnostic endpoint (if available):
```
https://your-app-url/api/calendar/diagnostic
```

This will show:
- Which calendar ID is being used
- Service account email
- Calendar access status

### Step 2: Test with a Single Request
Instead of syncing all requests, try syncing just one:
1. Find a specific vacation request ID
2. Use the diagnostic endpoint to test that specific request

### Step 3: Check Server Logs
Look for detailed error messages in:
- Vercel deployment logs
- Server console logs

The error message should include:
- The exact calendar ID being accessed
- The service account email being used
- The specific permission error

## Next Steps

1. **Wait 2-5 minutes** if you just added permissions
2. **Verify the calendar ID** in Vercel environment variables
3. **Try syncing again** after waiting
4. **Check the diagnostic endpoint** to see what calendar is actually being accessed

## If Still Not Working

If permissions are correct but errors persist:

1. **Remove and re-add the service account**:
   - Remove `vacation-db@holiday-461710.iam.gserviceaccount.com` from calendar sharing
   - Wait 1 minute
   - Add it back with "Make changes to events" permission

2. **Check for duplicate service accounts**:
   - I see `stars-vacation-calendar@holiday-461710.iam.gserviceaccount.com` in your list
   - Make sure you're using the correct one: `vacation-db@holiday-461710.iam.gserviceaccount.com`

3. **Verify service account credentials**:
   - Check that `GOOGLE_SERVICE_ACCOUNT_KEY` in Vercel contains the correct `client_email`

## Expected Behavior After Fix

Once permissions are working:
- ✅ Sync completes without errors
- ✅ Calendar events are created successfully
- ✅ No "writer access" errors in console
- ✅ Events appear in the target calendar

