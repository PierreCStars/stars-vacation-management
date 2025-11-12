# Google Calendar Sync Fix - Implementation Summary

## Date: 2025-01-XX

## Problem Statement

Approved vacation requests were not syncing to the target Google Calendar (`c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`). Additionally, there was a need to identify and document all calendar sources used by the application.

## Root Causes Identified

### 1. Incorrect Calendar ID Usage
- **Issue**: `addVacationToCalendar()` was using `process.env.GOOGLE_CALENDAR_ID` instead of `CAL_TARGET`
- **Impact**: Events might be created in the wrong calendar or fail if `GOOGLE_CALENDAR_ID` was not set
- **Location**: `src/lib/google-calendar.ts:119`

### 2. Missing Event Update Logic
- **Issue**: `ensureEventForRequest()` would skip creating events if an `eventId` existed, even when dates changed
- **Impact**: Date changes to approved vacations were not reflected in Google Calendar
- **Location**: `src/lib/calendar/sync.ts:59-62`

### 3. Date Updates Not Triggering Sync
- **Issue**: Calendar sync was only triggered on status updates, not date updates
- **Impact**: Changing vacation dates did not update the calendar event
- **Location**: `src/app/api/vacation-requests/[id]/route.ts:154`

### 4. Timezone Configuration
- **Issue**: Events were created with `timeZone: 'UTC'` instead of `Europe/Monaco`
- **Impact**: Potential timezone-related display issues (though all-day events should be fine)
- **Location**: `src/lib/google-calendar.ts:109, 113`

### 5. Inconsistent Calendar Client Usage
- **Issue**: `deleteVacationFromCalendar()` used `getJwt()` to create a new auth instance instead of the global calendar client
- **Impact**: Inconsistent authentication, potential performance issues
- **Location**: `src/lib/google-calendar.ts:339-354`

## Fixes Implemented

### 1. Fixed Calendar ID Usage
**File**: `src/lib/google-calendar.ts`

- Changed `addVacationToCalendar()` to use `CAL_TARGET` constant instead of `process.env.GOOGLE_CALENDAR_ID`
- `CAL_TARGET` is defined as: `process.env.GOOGLE_CALENDAR_TARGET_ID || process.env.GOOGLE_CALENDAR_ID || 'primary'`
- Ensures correct target calendar is always used

### 2. Added Event Update Functionality
**File**: `src/lib/google-calendar.ts`

- Created new `updateVacationInCalendar()` function to update existing calendar events
- Handles date changes, description updates, and maintains event metadata
- Uses same timezone and formatting as create function

**File**: `src/lib/calendar/sync.ts`

- Modified `ensureEventForRequest()` to detect date changes
- When dates change and an event exists, calls `updateVacationInCalendar()` instead of skipping
- Maintains idempotency by checking for existing events

### 3. Fixed Date Update Sync Trigger
**File**: `src/app/api/vacation-requests/[id]/route.ts`

- Extended calendar sync to trigger on both status updates AND date updates
- When dates are updated, sync is called with the new dates
- Ensures calendar events stay in sync with vacation request changes

### 4. Improved Timezone Handling
**File**: `src/lib/google-calendar.ts`

- Removed explicit `timeZone: 'UTC'` from all-day events (not needed for date-only events)
- Added timezone-aware date formatting in descriptions using `APP_TZ` (Europe/Monaco)
- Improved event descriptions with app URL and better formatting

### 5. Standardized Calendar Client Usage
**File**: `src/lib/google-calendar.ts`

- Updated `deleteVacationFromCalendar()` to use global `calendar` instance
- Consistent authentication across all calendar operations
- Better error logging with calendar ID in error messages

## Calendar Inventory

### Target Calendar (Validated Holidays)
- **ID**: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
- **Purpose**: Approved vacation requests are written here
- **Access**: Service account needs Writer/Owner permissions
- **ENV**: `GOOGLE_CALENDAR_TARGET_ID`

### Source Calendar (Company Events)
- **ID**: `c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`
- **Purpose**: Company events (meetings, team events) displayed in app
- **Access**: Service account needs Reader permissions
- **ENV**: `GOOGLE_CALENDAR_SOURCE_ID`
- **Location**: `src/app/api/calendar-events/route.ts:142`

### Source Calendar (Public Holidays)
- **ID**: `en-gb.mc#holiday@group.v.calendar.google.com`
- **Purpose**: Monaco public holidays
- **Access**: Public (no authentication required)
- **Location**: `src/app/api/calendar-events/route.ts:143`

## New Files Created

### 1. Reconciliation Script
**File**: `scripts/reconcile-vacations-to-calendar.ts`

- Backfills missing calendar events for approved vacation requests
- Supports dry-run mode for testing
- Configurable date range (default: 90 days)
- Generates detailed reconciliation report

**Usage**:
```bash
# Dry run
npx tsx scripts/reconcile-vacations-to-calendar.ts --days=90 --dry-run

# Actual sync
npx tsx scripts/reconcile-vacations-to-calendar.ts --days=90
```

### 2. Calendar Documentation
**File**: `docs/calendars.md`

- Complete inventory of all calendars
- Configuration details
- Troubleshooting guide
- Maintenance procedures

## Testing Recommendations

### 1. Manual Testing
1. **Create and Approve Vacation**:
   - Create a new vacation request
   - Approve it
   - Verify event appears in target calendar within 1 minute

2. **Update Vacation Dates**:
   - Edit an approved vacation's dates
   - Verify calendar event updates with new dates

3. **Deny Vacation**:
   - Deny an approved vacation
   - Verify calendar event is deleted

### 2. Reconciliation Script
Run the reconciliation script to backfill any missing events:
```bash
npx tsx scripts/reconcile-vacations-to-calendar.ts --days=90
```

### 3. Verify Permissions
Ensure service account has write access to target calendar:
- Service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- Calendar: `c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`
- Required permission: "Make changes to events" (Writer)

## Environment Variables

Ensure these are set in production (Vercel):
- `GOOGLE_CALENDAR_TARGET_ID`: Target calendar ID
- `GOOGLE_SERVICE_ACCOUNT_KEY` or `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`: Service account credentials
- `GOOGLE_CALENDAR_SOURCE_ID`: Source calendar ID (optional)
- `APP_TIMEZONE`: `Europe/Monaco` (optional, defaults to Europe/Monaco)

## Verification Checklist

- [x] Fixed calendar ID usage in `addVacationToCalendar()`
- [x] Added event update functionality
- [x] Fixed date update sync trigger
- [x] Improved timezone handling
- [x] Standardized calendar client usage
- [x] Created reconciliation script
- [x] Created calendar documentation
- [ ] Tested in staging environment
- [ ] Verified service account permissions
- [ ] Ran reconciliation script in production
- [ ] Confirmed events appear in target calendar

## Next Steps

1. **Deploy to Staging**: Test all fixes in staging environment
2. **Verify Permissions**: Confirm service account has write access to target calendar
3. **Run Reconciliation**: Execute reconciliation script to backfill missing events
4. **Monitor Logs**: Watch for `[CALENDAR]` prefixed log messages
5. **Production Deployment**: Deploy to production after successful staging tests

## Related Files Modified

- `src/lib/google-calendar.ts`: Core calendar operations
- `src/lib/calendar/sync.ts`: Sync logic
- `src/app/api/vacation-requests/[id]/route.ts`: API endpoint for updates

## Related Files Created

- `scripts/reconcile-vacations-to-calendar.ts`: Reconciliation script
- `docs/calendars.md`: Calendar documentation

---

**Status**: ✅ Implementation Complete
**Next Action**: Deploy to staging and test

