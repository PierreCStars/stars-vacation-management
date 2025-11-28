# Google Calendar Sync Fix - January 2025

## Problem Statement

Approved employee vacations were no longer syncing to the linked Google Calendar. The sync pipeline was failing silently without proper error reporting.

## Root Causes Identified

### 1. **Silent Calendar Client Initialization Failure** (CRITICAL)
- **Location**: `src/lib/google-calendar.ts:52-64`
- **Issue**: The global calendar client was initialized at module load time. If credentials failed to load, it would return an empty object `{}`, causing all subsequent API calls to fail silently.
- **Impact**: All calendar operations (create, update, delete) would fail without clear error messages.

### 2. **Insufficient Error Handling**
- **Location**: `src/lib/calendar/sync.ts`, `src/lib/google-calendar.ts`
- **Issue**: Errors were caught but not properly logged or reported, making debugging difficult.
- **Impact**: Failures were invisible to administrators and developers.

### 3. **Missing Error Context**
- **Location**: All calendar sync functions
- **Issue**: Error messages didn't include enough context (request ID, calendar ID, user info) to diagnose issues.
- **Impact**: Difficult to trace which requests failed and why.

## Fixes Implemented

### 1. **Lazy Calendar Client Initialization with Error Handling**

**File**: `src/lib/google-calendar.ts`

- Changed from global module-level initialization to lazy initialization
- Added `initializeCalendarClient()` function that:
  - Validates credentials before creating client
  - Throws descriptive errors if credentials are missing/invalid
  - Logs successful initialization with client email and target calendar
  - Reuses initialized client for subsequent calls

**Before**:
```typescript
const auth = new google.auth.GoogleAuth({
  credentials: (() => {
    try {
      return loadGoogleCreds();
    } catch (error) {
      console.error('❌ Error loading Google credentials:', error);
      return {}; // ❌ Returns empty object, causing silent failures
    }
  })(),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});
const calendar = google.calendar({ version: 'v3', auth });
```

**After**:
```typescript
function initializeCalendarClient() {
  if (authInstance && calendar) {
    return { auth: authInstance, calendar };
  }
  
  const credentials = loadGoogleCreds();
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error('Google Calendar credentials are missing or invalid');
  }
  
  authInstance = new google.auth.GoogleAuth({ credentials, ... });
  calendar = google.calendar({ version: 'v3', auth: authInstance });
  return { auth: authInstance, calendar };
}
```

### 2. **Enhanced Error Handling in Calendar Functions**

**Files**: `src/lib/google-calendar.ts`, `src/lib/calendar/sync.ts`

- Added try-catch blocks with detailed error logging
- Specific error messages for common failures:
  - Permission denied (403) → Clear message about service account permissions
  - Calendar not found (404) → Message about calendar ID configuration
  - Authentication errors → Message about credential configuration
- Error context includes: request ID, calendar ID, user info, dates

**Example**:
```typescript
catch (error) {
  if (errorMessage.includes('PERMISSION_DENIED')) {
    throw new Error(`Calendar permission denied. Please ensure the service account has write access to calendar: ${CAL_TARGET}`);
  }
  if (errorMessage.includes('NOT_FOUND')) {
    throw new Error(`Calendar not found: ${CAL_TARGET}. Please verify the calendar ID is correct.`);
  }
  // ... more specific errors
}
```

### 3. **Improved Sync Function Error Handling**

**File**: `src/lib/calendar/sync.ts`

- Added comprehensive logging at each step
- Store sync errors in Firestore for debugging (`calendarSyncError`, `calendarSyncErrorAt`)
- Retry logic: if update fails, attempt to create new event
- Better error propagation with context

### 4. **Diagnostic Endpoint**

**File**: `src/app/api/calendar/diagnostic/route.ts` (NEW)

Created a diagnostic endpoint to test calendar sync functionality:

- **GET `/api/calendar/diagnostic`**: 
  - Checks Firebase connection
  - Tests Google Calendar client initialization
  - Verifies calendar access and permissions
  - Lists approved requests without calendar events
  
- **POST `/api/calendar/diagnostic`**:
  - Tests syncing a specific vacation request
  - Returns detailed sync results

## Verification

### Sync is Called on Approval

Verified that both approval paths call `syncEventForRequest`:

1. **Server Action Path**: `src/app/[locale]/admin/vacation-requests/actions.ts:80`
   - `validateRequestAction()` → `syncEventForRequest()`

2. **API Route Path**: `src/app/api/vacation-requests/[id]/route.ts:189`
   - `PATCH /api/vacation-requests/[id]` → `syncEventForRequest()`

Both paths properly handle errors and don't fail the approval if calendar sync fails.

## Testing Instructions

### 1. Test Calendar Connection

```bash
# Test calendar connection and configuration
curl https://your-domain.com/api/calendar/diagnostic
```

Expected response:
```json
{
  "success": true,
  "diagnostics": {
    "tests": {
      "firebase": { "status": "✅ Connected" },
      "calendarClient": { "status": "✅ Initialized" },
      "calendarAccess": { "status": "✅ Found" },
      "approvedRequests": { "status": "✅ Checked" }
    }
  }
}
```

### 2. Test Sync for Specific Request

```bash
# Test syncing a specific vacation request
curl -X POST https://your-domain.com/api/calendar/diagnostic \
  -H "Content-Type: application/json" \
  -d '{"requestId": "your-request-id"}'
```

### 3. Test End-to-End Approval Flow

1. Create a vacation request
2. Approve it via admin interface
3. Check logs for `[CALENDAR]` entries
4. Verify event appears in Google Calendar
5. Check Firestore for `calendarEventId` field

### 4. Check for Failed Syncs

Query Firestore for requests with sync errors:
```javascript
db.collection('vacationRequests')
  .where('calendarSyncError', '!=', null)
  .get()
```

## Environment Variables Required

Ensure these are set in Vercel (or `.env.local` for local development):

```bash
# Google Calendar Service Account (one of these)
GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-json-key>
# OR
GOOGLE_SERVICE_ACCOUNT_KEY=<json-key-string>

# Calendar IDs
GOOGLE_CALENDAR_TARGET_ID=<target-calendar-id>
# Optional fallback
GOOGLE_CALENDAR_ID=<calendar-id>
```

## Common Issues and Solutions

### Issue: "Calendar permission denied"
**Solution**: Ensure the service account email has "Make changes to events" permission on the target calendar.

### Issue: "Calendar not found"
**Solution**: Verify `GOOGLE_CALENDAR_TARGET_ID` is correct and the calendar exists.

### Issue: "Google Calendar credentials are missing or invalid"
**Solution**: Check that either `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64` or `GOOGLE_SERVICE_ACCOUNT_KEY` is set correctly.

### Issue: Sync fails but approval succeeds
**Check**: 
1. Review server logs for `[CALENDAR]` entries
2. Check Firestore for `calendarSyncError` field
3. Use diagnostic endpoint to test connection

## Monitoring

### Log Patterns to Watch

- `[CALENDAR] Client initialized successfully` - Good sign
- `[CALENDAR] add_event success` - Event created
- `[CALENDAR] ensure_event fail` - Sync failed, check error message
- `[CALENDAR] sync_event exception` - Unexpected error

### Firestore Fields

- `calendarEventId` - Event ID if sync succeeded
- `calendarSyncedAt` - Last successful sync timestamp
- `calendarSyncError` - Error message if sync failed
- `calendarSyncErrorAt` - When sync failed

## Next Steps

1. **Monitor**: Watch logs for `[CALENDAR]` entries after approvals
2. **Test**: Use diagnostic endpoint to verify configuration
3. **Sync Existing**: Use `/api/sync/approved-requests` to sync any approved requests that missed sync
4. **Verify**: Check Google Calendar for new events after approvals

## Files Modified

1. `src/lib/google-calendar.ts` - Fixed client initialization, added error handling
2. `src/lib/calendar/sync.ts` - Enhanced error handling and logging
3. `src/app/api/calendar/diagnostic/route.ts` - New diagnostic endpoint

## Summary

The main issue was silent failure of calendar client initialization. By implementing lazy initialization with proper error handling, we now:

- ✅ Fail fast with clear error messages
- ✅ Log all operations for debugging
- ✅ Store errors in Firestore for analysis
- ✅ Provide diagnostic tools for troubleshooting
- ✅ Maintain backward compatibility

The sync should now work reliably, and if it fails, you'll know exactly why.



