# Google Calendar Service Account Configuration

## Overview

The Stars Vacation Management app syncs approved vacation requests to a shared Google Calendar. This document explains the service account configuration and how to verify it's working correctly.

## Calendar Configuration

**Target Calendar ID**: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

This calendar is shared with both service accounts (both have "Make changes to events" permission):
- **Canonical (Preferred)**: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- **Alternative**: `stars-vacation-management@appspot.gserviceaccount.com`

## Service Accounts

### Canonical Service Account (Preferred)
- **Email**: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- **Status**: ✅ Preferred for all calendar operations
- **Permissions**: Has "Make changes to events" on the target calendar

### Alternative Service Account
- **Email**: `stars-vacation-management@appspot.gserviceaccount.com`
- **Status**: ✅ Also has permissions (App Engine default service account)
- **Note**: Works but canonical account is preferred for consistency

## Environment Variables

The app loads Google Calendar credentials from environment variables in this order:

1. **`GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`** (preferred)
   - Base64-encoded JSON service account key
   - Should contain credentials for `vacation-db@holiday-461710.iam.gserviceaccount.com`

2. **`GOOGLE_SERVICE_ACCOUNT_KEY`** (fallback)
   - JSON string of the service account key
   - Can also be used with `GOOGLE_CLIENT_EMAIL` if key is in PEM format

### Vercel Configuration

To configure in Vercel:
1. Go to Project Settings → Environment Variables
2. Add or update:
   - `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`: Base64-encoded service account JSON
   - Or `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON string of service account key
3. Ensure the service account key is for `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Redeploy after updating environment variables

## Code Location

### Main Calendar Library
**File**: `src/lib/google-calendar.ts`

Key functions:
- `loadGoogleCreds()`: Loads and validates service account credentials
- `initializeCalendarClient()`: Initializes Google Calendar API client
- `addVacationToCalendar()`: Creates calendar events
- `updateVacationInCalendar()`: Updates existing events
- `deleteVacationFromCalendar()`: Deletes events

### Constants
```typescript
export const CANONICAL_SERVICE_ACCOUNT = 'vacation-db@holiday-461710.iam.gserviceaccount.com';
export const ALTERNATIVE_SERVICE_ACCOUNT = 'stars-vacation-management@appspot.gserviceaccount.com';
export const CAL_TARGET = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';
```

## Verification

### Diagnostic Endpoint
Visit `/api/calendar/diagnostic` to check:
- Which service account is actually being used
- Whether it matches the canonical or alternative account
- Calendar access status
- Any configuration issues

### Logs
The app logs service account information:
- `[CALENDAR] Credentials loaded`: Shows which service account is loaded
- `[CALENDAR] Client initialized successfully`: Confirms client initialization
- `[CALENDAR] add_event start`: Logs before creating events
- `[CALENDAR] add_event success`: Confirms successful event creation

Look for:
- ✅ `isCanonical: ✅` - Using preferred account
- ✅ `isAlternative: ✅` - Using alternative account (also works)
- ❌ `isValidServiceAccount: ❌ UNKNOWN` - Unknown account (may not have permissions)

## Troubleshooting

### "Calendar permission denied" Error

If you see this error:

1. **Check which service account is being used**:
   - Visit `/api/calendar/diagnostic`
   - Check server logs for `[CALENDAR] Credentials loaded`

2. **Verify calendar permissions**:
   - Go to Google Calendar → Settings → Share with specific people
   - Ensure the service account email has "Make changes to events" permission
   - Wait 2-5 minutes for permissions to propagate

3. **Verify environment variables**:
   - Check Vercel environment variables
   - Ensure the service account key matches the expected account
   - Redeploy after updating environment variables

4. **Check calendar ID**:
   - Verify `GOOGLE_CALENDAR_TARGET_ID` or `GOOGLE_CALENDAR_ID` is set correctly
   - Default: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

### Service Account Mismatch

If logs show a service account that's not canonical or alternative:

1. Update Vercel environment variables to use credentials for:
   - `vacation-db@holiday-461710.iam.gserviceaccount.com` (preferred)
   - Or `stars-vacation-management@appspot.gserviceaccount.com` (also works)

2. Redeploy the application

3. Verify with `/api/calendar/diagnostic`

## Best Practices

1. **Use Canonical Account**: Prefer `vacation-db@holiday-461710.iam.gserviceaccount.com` for consistency
2. **Explicit Credentials**: The app uses explicit credentials (not Application Default Credentials) to ensure predictable behavior
3. **Monitor Logs**: Check `[CALENDAR]` logs regularly to ensure correct service account is used
4. **Test After Changes**: After updating environment variables, test with `/api/calendar/diagnostic` and create a test vacation

## Related Files

- `src/lib/google-calendar.ts`: Main calendar library
- `src/lib/calendar/sync.ts`: Calendar sync service
- `src/app/api/sync/approved-requests/route.ts`: Sync API endpoint
- `src/app/api/calendar/diagnostic/route.ts`: Diagnostic endpoint
- `src/components/admin/AdminPendingRequestsV2.tsx`: Admin UI with sync button

