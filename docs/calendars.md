# Google Calendar Configuration

This document provides a complete inventory of all Google Calendars used by the Stars Vacation Management application.

## Overview

The application uses Google Calendar for:
1. **Target Calendar**: Writing approved vacation requests as events
2. **Source Calendars**: Reading company events and public holidays for display in the app

## Calendar Inventory

### 1. Target Calendar (Validated Holidays)

**Purpose**: Calendar where approved vacation requests are automatically written as events.

**Calendar ID**: 
```
c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com
```

**Environment Variable**: `GOOGLE_CALENDAR_TARGET_ID` (fallback: `GOOGLE_CALENDAR_ID`)

**Access**: Service account must have **Writer** or **Owner** permissions

**Location in Code**:
- `src/lib/google-calendar.ts` (line 72): `CAL_TARGET` constant
- `src/lib/calendar/sync.ts`: Used for creating/updating/deleting vacation events
- `src/app/api/vacation-requests/[id]/route.ts` (line 13): Hardcoded fallback

**Sync Behavior**:
- Events are created when a vacation request is approved
- Events are updated when vacation dates change
- Events are deleted when a vacation request is denied or cancelled
- All events are all-day events in `Europe/Monaco` timezone

---

### 2. Company Events Calendar (Source)

**Purpose**: Calendar containing company events (meetings, team events, etc.) that are displayed in the app.

**Calendar ID**: 
```
c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com
```

**Environment Variable**: `GOOGLE_CALENDAR_SOURCE_ID`

**Access**: Service account must have **Reader** permissions (at minimum)

**Location in Code**:
- `src/app/api/calendar-events/route.ts` (line 142): Hardcoded as `companyEventsCalendarId`
- `src/lib/google-calendar.ts` (line 73): `CAL_SOURCE` constant

**Usage**: Events from this calendar are fetched and displayed alongside vacation requests in the app's calendar view.

---

### 3. Monaco Public Holidays Calendar (Source)

**Purpose**: Calendar containing official Monaco public holidays.

**Calendar ID**: 
```
en-gb.mc#holiday@group.v.calendar.google.com
```

**Access**: Public calendar (no authentication required)

**Location in Code**:
- `src/app/api/calendar-events/route.ts` (line 143): Hardcoded as `monacoHolidaysCalendarId`

**Usage**: Public holidays from this calendar are fetched and displayed in the app to show official days off.

**Note**: This is a Google-provided public calendar for Monaco holidays.

---

## Service Account Configuration

### Service Account Email
The service account used for calendar operations:
```
vacation-db@holiday-461710.iam.gserviceaccount.com
```

### Required Permissions

**Target Calendar** (`c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com`):
- **Writer** or **Owner** role (required for creating/updating/deleting events)

**Source Calendar** (`c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`):
- **Reader** role (minimum, for reading events)

### API Scopes
The service account requires the following Google Calendar API scopes:
- `https://www.googleapis.com/auth/calendar` (full read/write access)

### Environment Variables

**Required**:
- `GOOGLE_SERVICE_ACCOUNT_KEY` or `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64`: Service account credentials (JSON)
- `GOOGLE_CALENDAR_TARGET_ID`: Target calendar ID for writing vacation events

**Optional**:
- `GOOGLE_CALENDAR_SOURCE_ID`: Source calendar ID for company events
- `GOOGLE_CALENDAR_ID`: Fallback for target calendar (legacy)
- `APP_TIMEZONE`: Timezone for events (default: `Europe/Monaco`)

---

## Event Format

### Vacation Event Structure

When a vacation request is approved, an event is created in the target calendar with:

- **Summary**: `{userName} - {companyDisplayName}`
- **Description**: 
  ```
  Name: {userName}
  Company: {companyDisplayName}
  Type: {type}
  Date Range: {startDate} - {endDate}
  Reason: {reason} (if provided)
  
  View in app: {baseUrl}
  ```
- **Start**: All-day date (YYYY-MM-DD format)
- **End**: All-day date (YYYY-MM-DD format, exclusive - day after last day)
- **Color**: Company-specific color (configured in `src/lib/company-colors.ts`)
- **Transparency**: `transparent` (shows as busy but transparent)

### All-Day Event Handling

Google Calendar all-day events use an **exclusive end date**. For a vacation from `2025-01-15` to `2025-01-17`:
- **Start**: `2025-01-15`
- **End**: `2025-01-18` (day after the last day)

This is handled automatically by the sync code.

---

## Sync Logic

### When Events Are Created
- Vacation request status changes to `approved`
- Triggered in: `src/app/api/vacation-requests/[id]/route.ts` (PATCH handler)

### When Events Are Updated
- Vacation request dates change (startDate or endDate)
- Triggered in: `src/lib/calendar/sync.ts` (`ensureEventForRequest`)

### When Events Are Deleted
- Vacation request status changes to `denied` or `pending`
- Triggered in: `src/lib/calendar/sync.ts` (`deleteEventForRequest`)

### Idempotency
- Event IDs are stored in Firestore (`calendarEventId` and `googleCalendarEventId` fields)
- Prevents duplicate events on retries
- Enables updates to existing events

---

## Troubleshooting

### Events Not Appearing in Target Calendar

1. **Check Service Account Permissions**:
   - Verify service account has Writer/Owner access to target calendar
   - Check calendar sharing settings in Google Calendar

2. **Check Environment Variables**:
   - Verify `GOOGLE_CALENDAR_TARGET_ID` is set correctly
   - Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is valid

3. **Check Logs**:
   - Look for `[CALENDAR]` prefixed log messages
   - Check for permission errors (403) or not found errors (404)

4. **Run Reconciliation Script**:
   ```bash
   npx tsx scripts/reconcile-vacations-to-calendar.ts
   ```

### Permission Errors

If you see `403 Forbidden` or `You need to have writer access to this calendar`:
1. Open Google Calendar
2. Find the target calendar
3. Click "Settings and sharing"
4. Under "Share with specific people", add the service account email
5. Set permission to "Make changes to events"

---

## Maintenance

### Renewing Calendar Watches (if implemented)
If push notifications are used (`/watch` API):
- Channels expire after a set time (typically 7 days)
- Implement automatic renewal before expiration
- Handle `410 Gone` responses by re-syncing

### Reconciliation
Run the reconciliation script periodically to ensure all approved vacations have calendar events:
```bash
# Dry run (check only)
npx tsx scripts/reconcile-vacations-to-calendar.ts --days=90 --dry-run

# Actual sync
npx tsx scripts/reconcile-vacations-to-calendar.ts --days=90
```

---

## Related Documentation

- `GOOGLE_CALENDAR_INTEGRATION.md`: Setup guide
- `FIX_GOOGLE_CALENDAR.md`: Troubleshooting guide
- `CALENDAR_INTEGRATION_README.md`: Implementation details

---

**Last Updated**: 2025-01-XX
**Maintained By**: Stars Development Team

