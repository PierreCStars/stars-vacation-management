# Calendar Communication Analysis
## Calendar ID: `c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com`

## ✅ Current Implementation Status

### 1. API Endpoint Implementation
**File**: `src/app/api/calendar-events/route.ts`

**Status**: ✅ Implemented with error handling

**Key Points**:
- Calendar ID is **hardcoded** at line 142
- Fetches events using `calendar.events.list()` API
- Error handling: Catches errors but continues (line 194-196)
- Time range: 3 months back to 9 months forward (default)

**Code Flow**:
```typescript
// Line 182-196
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
  // ⚠️ Error is logged but execution continues
}
```

### 2. Frontend Integration
**File**: `src/components/UnifiedVacationCalendar.tsx`

**Status**: ✅ Integrated

**Key Points**:
- Calls `/api/calendar-events?includeVacationRequests=true` (line 103)
- Sets company events state (line 108)
- Has error handling (line 109-115)

**Code Flow**:
```typescript
// Line 100-119
const fetchCompanyEvents = async () => {
  try {
    setLoadingEvents(true);
    const response = await fetch('/api/calendar-events?includeVacationRequests=true', {
      next: { tags: ['calendar:all'] }
    });
    if (response.ok) {
      const data = await response.json();
      setCompanyEvents(data.events || []);
    } else {
      console.error('Failed to fetch company events:', response.status);
      setCompanyEvents([]);
    }
  } catch (error) {
    console.error('Error fetching company events:', error);
    setCompanyEvents([]);
  } finally {
    setLoadingEvents(false);
  }
};
```

---

## 🔍 Potential Issues

### Issue 1: Silent Failures
**Problem**: Errors are caught but not surfaced to the user
- API catches calendar errors but continues (line 195)
- Frontend catches errors but just sets empty array (line 115)
- User may not know calendar events aren't loading

**Impact**: Low visibility - events just don't appear

### Issue 2: Hardcoded Calendar ID
**Problem**: Calendar ID is hardcoded instead of using environment variable
- Line 142: `const companyEventsCalendarId = 'c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com';`
- Should use: `process.env.GOOGLE_CALENDAR_SOURCE_ID || companyEventsCalendarId`

**Impact**: Cannot change calendar without code modification

### Issue 3: Error Details Not Logged
**Problem**: Error object details may not be fully logged
- Line 195: `console.error('[CALENDAR_API] Failed to fetch from company events calendar:', calendarError);`
- May not include HTTP status, error code, or detailed message

**Impact**: Difficult to diagnose permission/access issues

---

## ✅ What's Working

1. **API Endpoint**: `/api/calendar-events` is properly implemented
2. **Error Handling**: Errors are caught (prevents crashes)
3. **Fallback**: Falls back to Firestore-only if Google Calendar fails
4. **Frontend Integration**: Component properly fetches and displays events
5. **Time Range**: Fetches appropriate date range (3 months back, 9 months forward)

---

## 🔧 Recommendations

### 1. Improve Error Logging
Add more detailed error information:

```typescript
} catch (calendarError) {
  const errorDetails = {
    message: calendarError instanceof Error ? calendarError.message : String(calendarError),
    code: (calendarError as any)?.code,
    status: (calendarError as any)?.response?.status,
    statusText: (calendarError as any)?.response?.statusText,
    calendarId: companyEventsCalendarId
  };
  console.error('[CALENDAR_API] Failed to fetch from company events calendar:', errorDetails);
}
```

### 2. Use Environment Variable
Make calendar ID configurable:

```typescript
const companyEventsCalendarId = process.env.GOOGLE_CALENDAR_SOURCE_ID || 
  'c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com';
```

### 3. Add Diagnostic Endpoint
Create a diagnostic endpoint to test calendar access:

```typescript
// /api/calendar-events/diagnostic
// Returns: calendar access status, event count, error details
```

### 4. Surface Errors to Frontend
Return error information in API response:

```typescript
return NextResponse.json({
  success: true,
  events: allEvents,
  errors: {
    companyCalendar: calendarError ? errorDetails : null,
    // ... other calendar errors
  },
  // ...
});
```

---

## 🧪 Testing Checklist

- [ ] Verify calendar ID is correct
- [ ] Test API endpoint directly: `GET /api/calendar-events`
- [ ] Check server logs for `✅ Found X company calendar events`
- [ ] Check server logs for error messages
- [ ] Verify service account has read permissions
- [ ] Test frontend calendar view shows events
- [ ] Test error handling (disable credentials, check fallback)

---

## 📊 Current Communication Flow

```
Frontend (UnifiedVacationCalendar)
  ↓
  GET /api/calendar-events?includeVacationRequests=true
  ↓
  Server (calendar-events/route.ts)
  ↓
  Check Google Calendar credentials
  ↓
  Initialize Google Calendar API client
  ↓
  Fetch from company events calendar (c_1ee147e8254f6b2d5985d9ce6c4f9b39983d00cdcfe3c3732fa3aa33a1e30e0e@group.calendar.google.com)
  ↓
  calendar.events.list({ calendarId, timeMin, timeMax })
  ↓
  ✅ Success: Return events
  ❌ Error: Log error, continue with other calendars
  ↓
  Combine with Monaco holidays + Firestore events
  ↓
  Return JSON response
  ↓
  Frontend displays events in calendar view
```

---

## 🎯 Next Steps

1. **Check Server Logs**: Look for `[CALENDAR_API]` messages in production
2. **Test API Endpoint**: Call `/api/calendar-events` directly
3. **Verify Permissions**: Ensure service account has read access
4. **Improve Error Handling**: Implement recommendations above
5. **Add Monitoring**: Track calendar fetch success/failure rates

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ Implemented, ⚠️ Error handling could be improved
