# Google Calendar Service Account Fix - Complete

## Problem Summary

**Error**: `Calendar permission denied. Service Account: star...`

**Root Cause**: The app is using a **different service account** than the one that has calendar permissions.

- **Expected**: `vacation-db@holiday-461710.iam.gserviceaccount.com` ✅ (has calendar permissions)
- **Actual**: Service account starting with "star..." ❌ (does NOT have calendar permissions)

## Solution Implemented

### 1. Service Account Validation ✅
- Added constant: `EXPECTED_SERVICE_ACCOUNT = 'vacation-db@holiday-461710.iam.gserviceaccount.com'`
- Validates credentials on every load
- Logs mismatch immediately with clear warnings

### 2. Enhanced Logging ✅
**Location**: `src/lib/google-calendar.ts`

Now logs:
- Which service account is actually being used
- Which environment variable provided the credentials
- Comparison with expected service account
- HTTP status codes and API error details

**Example log output**:
```
[CALENDAR] Credentials loaded {
  source: 'GOOGLE_SERVICE_ACCOUNT_KEY',
  serviceAccountEmail: 'stars-vacation-calendar@holiday-461710.iam.gserviceaccount.com',
  expectedServiceAccount: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  serviceAccountMatch: '❌ MISMATCH',
  warning: '⚠️ Using service account "stars-vacation-calendar@..." but expected "vacation-db@..."'
}
```

### 3. Diagnostic Endpoint ✅
**Location**: `/api/calendar/diagnostic`

Now shows:
- Actual service account email
- Expected service account email  
- Match status (✅ or ❌)
- Critical issue warnings if mismatch

### 4. Error Messages ✅
All error messages now include:
- Actual service account being used
- Expected service account
- Clear fix instructions

## What to Check in Vercel

### Step 1: Check Current Environment Variables

Go to Vercel → Project Settings → Environment Variables

Look for:
- `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`
- `GOOGLE_SERVICE_ACCOUNT_KEY`
- `GOOGLE_CLIENT_EMAIL`

### Step 2: Identify Wrong Credentials

After deploying these changes, check the logs:
1. Visit `/api/calendar/diagnostic`
2. Look for `serviceAccountMatch: false`
3. Note the `clientEmail` value (this is the wrong one)

### Step 3: Update to Correct Credentials

1. **Get correct service account key**:
   - Google Cloud Console → Project `holiday-461710`
   - Service Accounts → `vacation-db@holiday-461710.iam.gserviceaccount.com`
   - Keys → Create new key (JSON)

2. **Update Vercel**:
   - Option A: Set `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64` (base64 encoded JSON)
   - Option B: Set `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string)
   - **Remove** any old credentials with wrong service account

3. **Redeploy**

### Step 4: Verify

After redeploy:
1. Check `/api/calendar/diagnostic`
   - Should show: `serviceAccountMatch: true`
   - Should show: `clientEmail: vacation-db@holiday-461710.iam.gserviceaccount.com`

2. Test sync:
   - Use "Sync to Calendar" button
   - Should succeed without permission errors

## Code Changes Summary

### Files Modified:

1. **`src/lib/google-calendar.ts`**
   - Added `EXPECTED_SERVICE_ACCOUNT` constant
   - Enhanced `loadGoogleCreds()` with validation
   - Logs credential source and service account
   - Enhanced error messages with service account info

2. **`src/app/api/calendar/diagnostic/route.ts`**
   - Shows service account verification
   - Highlights mismatches as critical issues

3. **`src/app/api/sync/approved-requests/route.ts`**
   - Verifies service account before syncing
   - Includes service account in error responses

## Expected Log Output After Fix

### Successful Configuration:
```
[CALENDAR] Configuration loaded {
  targetCalendarId: 'c_e98f5350...',
  expectedServiceAccount: 'vacation-db@holiday-461710.iam.gserviceaccount.com'
}

[CALENDAR] Credentials loaded {
  source: 'GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64',
  serviceAccountEmail: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  expectedServiceAccount: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  serviceAccountMatch: '✅ MATCH'
}

[CALENDAR] Client initialized successfully {
  clientEmail: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  serviceAccountMatch: '✅ MATCH'
}
```

### Wrong Service Account (Current Issue):
```
[CALENDAR] Credentials loaded {
  source: 'GOOGLE_SERVICE_ACCOUNT_KEY',
  serviceAccountEmail: 'stars-vacation-calendar@holiday-461710.iam.gserviceaccount.com',
  expectedServiceAccount: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  serviceAccountMatch: '❌ MISMATCH',
  warning: '⚠️ Using service account "stars-vacation-calendar@..." but expected "vacation-db@..."'
}

[CALENDAR] ⚠️ SERVICE ACCOUNT MISMATCH! {
  actual: 'stars-vacation-calendar@holiday-461710.iam.gserviceaccount.com',
  expected: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  message: 'The app is using a different service account than expected. This will cause permission errors.',
  fix: 'Update environment variables to use credentials for vacation-db@holiday-461710.iam.gserviceaccount.com'
}
```

## Next Steps

1. **Deploy these changes** (already committed)
2. **Check diagnostic endpoint** to see which service account is actually being used
3. **Update Vercel environment variables** with correct credentials
4. **Redeploy and verify** service account matches expected

## Documentation

- `SERVICE_ACCOUNT_FIX.md` - Detailed fix guide
- `GOOGLE_CALENDAR_SYNC_FIX_COMPLETE.md` - Previous sync fixes
- `docs/calendars.md` - Calendar configuration reference

---

**Status**: ✅ Code fixes complete  
**Action Required**: Update Vercel environment variables with correct service account credentials

