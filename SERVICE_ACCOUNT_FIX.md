# Service Account Mismatch Fix

## Problem Identified

The app is showing errors like:
```
Calendar permission denied. Service Account: star...
```

But the calendar is shared with: `vacation-db@holiday-461710.iam.gserviceaccount.com`

This indicates the app is using **wrong service account credentials**.

## Root Cause

The app loads credentials from multiple environment variables in this order:
1. `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64` (first priority)
2. `GOOGLE_SERVICE_ACCOUNT_KEY` (fallback)

If Vercel has the wrong credentials in these variables, the app will use the wrong service account.

## Solution Implemented

### 1. Service Account Validation
- Added `EXPECTED_SERVICE_ACCOUNT` constant: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- Validates credentials on load
- Logs mismatch warnings immediately
- Shows clear error messages if wrong account is used

### 2. Enhanced Logging
- Logs which service account is actually being used
- Shows credential source (which env var was used)
- Compares actual vs expected service account
- Logs HTTP status codes and API responses

### 3. Diagnostic Endpoint
- `/api/calendar/diagnostic` now shows:
  - Actual service account email
  - Expected service account email
  - Match status
  - Critical issue warnings if mismatch

## How to Fix in Vercel

### Step 1: Get Correct Service Account Key
1. Go to Google Cloud Console
2. Project: `holiday-461710`
3. IAM & Admin → Service Accounts
4. Find: `vacation-db@holiday-461710.iam.gserviceaccount.com`
5. Keys → Add Key → Create new key (JSON)
6. Download the JSON file

### Step 2: Update Vercel Environment Variables

**Option A: Base64 Encoded (Recommended)**
1. Convert JSON to base64:
   ```bash
   cat service-account-key.json | base64
   ```
2. In Vercel → Project Settings → Environment Variables:
   - Variable: `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`
   - Value: (paste base64 string)
   - Environment: Production, Preview, Development

**Option B: JSON String**
1. In Vercel → Project Settings → Environment Variables:
   - Variable: `GOOGLE_SERVICE_ACCOUNT_KEY`
   - Value: (paste entire JSON as string)
   - Environment: Production, Preview, Development

### Step 3: Verify
1. Redeploy the app
2. Visit `/api/calendar/diagnostic`
3. Check that:
   - `serviceAccountMatch: true`
   - `clientEmail: vacation-db@holiday-461710.iam.gserviceaccount.com`

### Step 4: Remove Old Credentials
If there are old service account credentials:
1. Check for variables like:
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (if it has wrong account)
   - `GOOGLE_CLIENT_EMAIL` (if it points to wrong account)
2. Either update them or remove them (if using base64 version)

## Verification

After updating credentials:

1. **Check Logs**: Look for:
   ```
   [CALENDAR] Credentials loaded {
     serviceAccountEmail: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
     serviceAccountMatch: '✅ MATCH'
   }
   ```

2. **Test Sync**: Use "Sync to Calendar" button
   - Should succeed without permission errors
   - Events should appear in calendar

3. **Check Diagnostic**: `/api/calendar/diagnostic`
   - Should show `serviceAccountMatch: true`
   - No critical issues

## Expected Behavior After Fix

- ✅ Service account matches expected: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- ✅ Calendar sync succeeds
- ✅ No "permission denied" errors
- ✅ Events appear in target calendar

## Code Changes

### Files Modified:
1. `src/lib/google-calendar.ts`
   - Added `EXPECTED_SERVICE_ACCOUNT` constant
   - Added validation in `loadGoogleCreds()`
   - Enhanced error messages with service account info
   - Logs credential source

2. `src/app/api/calendar/diagnostic/route.ts`
   - Shows service account verification
   - Highlights mismatches

3. `src/app/api/sync/approved-requests/route.ts`
   - Verifies service account before syncing
   - Logs which account is being used

## Troubleshooting

### Still seeing "star..." in errors?
- Check Vercel environment variables
- Verify which variable is being used (check logs for "source")
- Remove old credentials if present
- Redeploy after updating

### Service account match but still failing?
- Verify calendar is shared with `vacation-db@holiday-461710.iam.gserviceaccount.com`
- Check permissions are "Make changes to events"
- Wait 2-5 minutes for permissions to propagate

