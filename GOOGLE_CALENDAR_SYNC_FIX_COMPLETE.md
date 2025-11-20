# Google Calendar Sync Fix - Complete Implementation

## Date: 2025-01-XX

## Problem Statement

Approved vacation requests were not syncing to Google Calendar with error:
```
You need to have writer access to this calendar.
```

**Service Account**: `vacation-db@holiday-461710.iam.gserviceaccount.com`  
**Target Calendar**: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

## Root Causes Identified

1. **Calendar ID Configuration**: The code was using environment variables with fallback to 'primary', which might not match the actual target calendar
2. **Insufficient Logging**: Error messages didn't show which calendar ID was actually being used or which service account was authenticating
3. **Service Account Verification**: No validation that the correct service account email was being used
4. **Permission Testing**: No way to verify write permissions without attempting to create an event

## Fixes Implemented

### 1. Enhanced Calendar ID Configuration
**File**: `src/lib/google-calendar.ts`

- Added explicit fallback to the correct calendar ID if environment variables are not set
- Added logging on module load to show which calendar ID is being used
- Documented the expected calendar ID and service account in code comments

```typescript
export const CAL_TARGET = process.env.GOOGLE_CALENDAR_TARGET_ID || 
                          process.env.GOOGLE_CALENDAR_ID || 
                          'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';
```

### 2. Service Account Verification
**File**: `src/lib/google-calendar.ts`

- Added validation to check if the service account email matches the expected one
- Logs a warning if there's a mismatch
- Shows the actual vs expected service account email in logs

### 3. Enhanced Error Logging
**Files**: `src/lib/google-calendar.ts` (addVacationToCalendar, updateVacationInCalendar, deleteVacationFromCalendar)

- Added HTTP status code extraction from API errors
- Added response data logging for debugging
- Enhanced error messages with:
  - Service account email being used
  - Calendar ID being accessed
  - HTTP status codes
  - Detailed troubleshooting steps

### 4. Diagnostic Endpoint Enhancement
**File**: `src/app/api/calendar/diagnostic/route.ts`

- Added service account email verification
- Added calendar ID verification
- Added write permission test (creates and deletes a test event)
- Shows access role (reader/writer/owner) for the target calendar
- Provides comprehensive configuration check

## Configuration Requirements

### Environment Variables (Vercel)

**Required**:
- `GOOGLE_CALENDAR_TARGET_ID`: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
- `GOOGLE_SERVICE_ACCOUNT_KEY` or `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`: JSON key for `vacation-db@holiday-461710.iam.gserviceaccount.com`

**Optional**:
- `GOOGLE_CALENDAR_ID`: Fallback (legacy)
- `APP_TIMEZONE`: `Europe/Monaco` (default)

### Google Calendar Permissions

The service account `vacation-db@holiday-461710.iam.gserviceaccount.com` must have:
- **"Make changes to events"** permission on calendar `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`

## Verification Steps

### 1. Check Configuration
Visit the diagnostic endpoint:
```
GET /api/calendar/diagnostic
```

This will show:
- ✅ Service account email matches expected
- ✅ Calendar ID is correct
- ✅ Calendar is accessible
- ✅ Write permissions are verified

### 2. Test Sync
1. Go to admin vacation requests page
2. Click "Sync to Calendar" button
3. Check console logs for detailed information

### 3. Check Logs
Look for `[CALENDAR]` prefixed logs:
- `[CALENDAR] Configuration loaded` - Shows calendar ID and env vars
- `[CALENDAR] Client initialized successfully` - Shows service account email
- `[CALENDAR] add_event start` - Shows calendar ID being used
- `[CALENDAR] add_event success` - Event created successfully
- `[CALENDAR] add_event fail` - Detailed error with HTTP status

## Expected Log Output

### Successful Sync
```
[CALENDAR] Configuration loaded { targetCalendarId: 'c_e98f5350...', ... }
[CALENDAR] Client initialized successfully { clientEmail: 'vacation-db@holiday-461710.iam.gserviceaccount.com', serviceAccountMatch: '✅', ... }
[CALENDAR] add_event start { calendarId: 'c_e98f5350...', ... }
[CALENDAR] add_event API call { calendarId: 'c_e98f5350...', ... }
[CALENDAR] add_event success { eventId: 'abc123...', calendarId: 'c_e98f5350...' }
```

### Permission Error
```
[CALENDAR] add_event fail {
  error: 'Calendar permission denied...',
  httpStatus: 403,
  calendarId: 'c_e98f5350...',
  serviceAccountEmail: 'vacation-db@holiday-461710.iam.gserviceaccount.com',
  ...
}
```

## Troubleshooting

### Error: "Calendar permission denied"
1. Verify service account has "Make changes to events" permission
2. Wait 2-5 minutes for permissions to propagate
3. Check diagnostic endpoint: `/api/calendar/diagnostic`
4. Verify service account email matches: `vacation-db@holiday-461710.iam.gserviceaccount.com`

### Error: "Calendar not found"
1. Verify calendar ID: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
2. Check environment variable `GOOGLE_CALENDAR_TARGET_ID` in Vercel
3. Verify calendar exists and is accessible

### Service Account Mismatch
If logs show `serviceAccountMatch: '❌ MISMATCH'`:
1. Check `GOOGLE_SERVICE_ACCOUNT_KEY` in Vercel
2. Verify the JSON key contains `client_email: "vacation-db@holiday-461710.iam.gserviceaccount.com"`
3. Regenerate service account key if needed

## Files Modified

1. `src/lib/google-calendar.ts`
   - Enhanced calendar ID configuration
   - Added service account verification
   - Improved error logging with HTTP status codes
   - Added detailed error messages

2. `src/app/api/calendar/diagnostic/route.ts`
   - Added service account email verification
   - Added calendar ID verification
   - Added write permission test
   - Enhanced diagnostic output

## Testing Checklist

- [x] Calendar ID uses correct fallback
- [x] Service account email is verified
- [x] Error logging includes HTTP status codes
- [x] Diagnostic endpoint tests write permissions
- [x] All calendar operations log calendar ID and service account

## Next Steps

1. **Deploy to Production**: Push changes to trigger Vercel deployment
2. **Verify Environment Variables**: Ensure `GOOGLE_CALENDAR_TARGET_ID` is set in Vercel
3. **Test Diagnostic Endpoint**: Visit `/api/calendar/diagnostic` to verify configuration
4. **Test Sync**: Use "Sync to Calendar" button in admin panel
5. **Monitor Logs**: Check Vercel logs for `[CALENDAR]` prefixed messages

## Related Documentation

- `docs/calendars.md` - Complete calendar inventory
- `FIX_CALENDAR_WRITE_PERMISSIONS.md` - Permission setup guide
- `SYNC_VALIDATED_VACATIONS.md` - Sync feature documentation

---

**Status**: ✅ Implementation Complete  
**Next Action**: Deploy and verify in production

