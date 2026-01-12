# Google Calendar Communication Check
## Calendar ID: `c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`

## Overview

This calendar is used as a **SOURCE calendar** (read-only) in the Stars Vacation Management system. It contains company events that are displayed alongside vacation requests in the application.

---

## Calendar Role

**Type**: Source Calendar (Read-Only)  
**Purpose**: Company Events Calendar  
**Access Level Required**: Reader (minimum) - "See all event details" permission

---

## How It's Used in the System

### 1. API Endpoint: `/api/calendar-events`

**Location**: `src/app/api/calendar-events/route.ts` (line 142)

The calendar is hardcoded as `companyEventsCalendarId` and used in the GET handler:

```182:196:src/app/api/calendar-events/route.ts
    // Fetch from company events calendar
    try {
      const response = await calendar.events.list({
        calendarId: companyEventsCalendarId,
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      const companyEvents = response.data.items || [];
      console.log(`✅ Found ${companyEvents.length} company calendar events`);
      events.push(...companyEvents);
    } catch (calendarError) {
      console.error('[CALENDAR_API] Failed to fetch from company events calendar:', calendarError);
    }
```

### 2. Communication Flow

1. **Client Request**: Frontend calls `/api/calendar-events?timeMin=...&timeMax=...`
2. **Server Processing**:
   - Loads Google Calendar credentials from environment variables
   - Initializes Google Calendar API client
   - Fetches events from this calendar using `calendar.events.list()`
   - Also fetches from Monaco holidays calendar
   - Optionally includes Firestore vacation requests
3. **Response**: Returns combined events from all sources

### 3. Time Range

The system fetches events in a wide range:
- **Default**: 3 months back to 9 months forward
- **Custom**: Can be specified via `timeMin` and `timeMax` query parameters

```171:174:src/app/api/calendar-events/route.ts
    // Set default time range if not provided - fetch 12 months of data to show all events
    const now = new Date();
    const startDate = timeMin ? new Date(timeMin) : new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const endDate = timeMax ? new Date(timeMax) : new Date(now.getFullYear(), now.getMonth() + 9, 0);
```

---

## Service Account Configuration

### Required Service Account

The system uses one of these service accounts:
- **Preferred**: `vacation-db@holiday-461710.iam.gserviceaccount.com`
- **Alternative**: `stars-vacation-management@appspot.gserviceaccount.com`

### Required Permissions

For this **SOURCE calendar** (read-only):
- **Minimum**: "See all event details" (Reader)
- **Recommended**: "Make changes to events" (Writer) - if you want to test write operations

### Environment Variables

The service account credentials are loaded from:
- `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64` (preferred)
- `GOOGLE_SERVICE_ACCOUNT_KEY` (fallback)

---

## How to Verify Communication

### Method 1: Check API Endpoint Directly

Call the API endpoint directly:

```bash
# Get events from the calendar
curl "https://your-app-url/api/calendar-events?timeMin=2025-01-01T00:00:00Z&timeMax=2025-12-31T23:59:59Z"
```

Look for:
- `✅ Found X company calendar events` in the response
- Events array containing items from this calendar

### Method 2: Check Server Logs

In Vercel deployment logs or local server console, look for:

```
[CALENDAR_API] start
✅ Found X company calendar events
```

Or error messages:
```
[CALENDAR_API] Failed to fetch from company events calendar: [error details]
```

### Method 3: Use Test Script

Run the diagnostic script (requires environment variables):

```bash
node test-calendar-communication.cjs
```

This will test:
- ✅ Calendar metadata access
- ✅ Event listing (30 days range)
- ✅ Event listing (wider range)

---

## Common Issues and Solutions

### Issue 1: No Events Returned

**Symptoms**: API returns empty events array or 0 company calendar events

**Possible Causes**:
1. Calendar has no events in the time range
2. Service account lacks read permissions
3. Calendar ID is incorrect

**Solutions**:
1. Verify calendar has events in Google Calendar UI
2. Check service account has "See all event details" permission
3. Verify calendar ID matches exactly

### Issue 2: Permission Denied (403)

**Symptoms**: `[CALENDAR_API] Failed to fetch from company events calendar: 403 Forbidden`

**Solution**:
1. Go to Google Calendar → Find the calendar
2. Settings and sharing → Share with specific people
3. Add service account: `vacation-db@holiday-461710.iam.gserviceaccount.com`
4. Set permission: "See all event details" (minimum) or "Make changes to events"
5. Wait 2-5 minutes for permissions to propagate

### Issue 3: Calendar Not Found (404)

**Symptoms**: `[CALENDAR_API] Failed to fetch from company events calendar: 404 Not Found`

**Solution**:
1. Verify calendar ID is correct: `c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`
2. Check calendar exists and is accessible
3. Verify calendar hasn't been deleted or renamed

### Issue 4: Authentication Failed

**Symptoms**: `Google Auth failed` or credential errors

**Solution**:
1. Verify `GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY_BASE64` or `GOOGLE_SERVICE_ACCOUNT_KEY` is set
2. Check credentials are valid JSON
3. Verify service account email matches expected accounts

---

## Event Format

Events from this calendar are formatted and returned with:

```typescript
{
  id: string;                    // Google Calendar event ID
  title: string;                 // Event summary/title
  startDate: string;             // YYYY-MM-DD format
  endDate: string;               // YYYY-MM-DD format (inclusive)
  location: string;              // Event location
  summary: string;               // Event summary
  description: string;           // Event description
  colorId: string;               // Google Calendar color ID
  company: string;               // Extracted from summary or description
  userName: string;              // Extracted from summary or description
  htmlLink: string;              // Link to event in Google Calendar
}
```

The system attempts to extract `company` and `userName` from the event summary (format: "UserName - CompanyName") or description.

---

## Integration Points

### Where Events Are Displayed

1. **Calendar View**: Events from this calendar appear alongside vacation requests
2. **List View**: Company events may be included in event lists
3. **Summary View**: Events contribute to conflict detection

### Code Locations

- **API Route**: `src/app/api/calendar-events/route.ts` (line 142, 184)
- **Calendar Configuration**: `docs/calendars.md` (line 45)
- **Documentation**: `GOOGLE_CALENDAR_INTEGRATION.md` (line 24)

---

## Testing Checklist

- [ ] Service account has access to calendar
- [ ] Calendar ID is correct in code
- [ ] API endpoint returns events successfully
- [ ] Events appear in frontend calendar view
- [ ] Error handling works (graceful fallback if calendar unavailable)
- [ ] Time range queries work correctly
- [ ] Event formatting is correct

---

## Next Steps

1. **Verify Permissions**: Ensure service account has read access
2. **Test API Endpoint**: Call `/api/calendar-events` and check response
3. **Check Logs**: Review server logs for any errors
4. **Test Frontend**: Verify events appear in the calendar view

---

**Last Updated**: 2025-01-XX  
**Calendar ID**: `c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`  
**Status**: Source Calendar (Read-Only)
