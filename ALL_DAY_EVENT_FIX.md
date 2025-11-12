# All-Day Event "+1 Day" Display Bug Fix

## Date: 2025-01-XX

## Problem Statement

All-day holidays and events from Google Calendar were displaying an extra day. For example, Christmas on December 25th was also appearing on December 26th.

## Root Cause

Google Calendar uses **exclusive end dates** for all-day events:
- A one-day holiday on `2025-12-25` has: `start.date='2025-12-25'`, `end.date='2025-12-26'` (exclusive)
- The event ends at the start of `2025-12-26`, meaning it should only appear on `2025-12-25`

However, the app was:
1. **Not normalizing** exclusive end dates from Google Calendar API responses
2. **Using inclusive end date logic** in the UI (`date <= end`), which caused events to spill onto the next day

## Solution

### 1. API Normalization (`src/app/api/calendar-events/route.ts`)

Added normalization logic to convert exclusive end dates to inclusive when processing Google Calendar events:

```typescript
// For all-day events, Google Calendar uses exclusive end dates
// Convert to inclusive for our app
if (isAllDay && endDate && endDate !== startDate) {
  // Subtract one day from exclusive end date to get inclusive end date
  const endDateObj = new Date(endDate + 'T00:00:00');
  endDateObj.setDate(endDateObj.getDate() - 1);
  endDate = formatDateOnly(endDateObj);
} else if (isAllDay && (!endDate || endDate === startDate)) {
  // Single-day event: end date should equal start date
  endDate = startDate;
}
```

### 2. Date Normalization Utility (`src/lib/date-normalization.ts`)

Created a utility module with functions to:
- Convert exclusive end dates to inclusive
- Normalize all-day events from Google Calendar format
- Check if a day falls within an all-day event range

### 3. Calendar Source API (`src/app/api/calendar/source/route.ts`)

Updated to use the same normalization logic for consistency.

### 4. Calendar Component (`src/components/UnifiedVacationCalendar.tsx`)

Added comments clarifying that:
- Vacation requests use inclusive end dates (stored in Firestore)
- Company events are normalized to inclusive end dates by the API
- The UI logic (`date >= start && date <= end`) is correct for inclusive dates

## Testing

### Unit Tests (`src/lib/__tests__/date-normalization.test.ts`)

Added comprehensive tests covering:
- ✅ Single-day event normalization (Christmas 2025)
- ✅ Multi-day event normalization (Dec 24-26)
- ✅ DST boundary handling (March 2025)
- ✅ Year boundary handling
- ✅ Leap year handling

All 21 tests pass.

### Test Scenarios

1. **Single-Day Holiday**:
   - Input: `start.date='2025-12-25'`, `end.date='2025-12-26'` (exclusive)
   - Expected: Appears only on Dec 25
   - Result: ✅ Correct

2. **Multi-Day Holiday**:
   - Input: `start.date='2025-12-24'`, `end.date='2025-12-27'` (exclusive)
   - Expected: Appears on Dec 24, 25, 26 only
   - Result: ✅ Correct

3. **DST Boundary**:
   - Input: `start.date='2025-03-29'`, `end.date='2025-04-01'` (exclusive)
   - Expected: Appears on March 29, 30, 31 only (no day shift)
   - Result: ✅ Correct

## Files Modified

1. `src/app/api/calendar-events/route.ts` - Added normalization for all-day events
2. `src/app/api/calendar/source/route.ts` - Improved normalization logic
3. `src/components/UnifiedVacationCalendar.tsx` - Added clarifying comments
4. `src/lib/date-normalization.ts` - New utility module (created)
5. `src/lib/__tests__/date-normalization.test.ts` - New test file (created)

## Verification Checklist

- [x] API normalizes exclusive end dates to inclusive
- [x] Calendar component uses inclusive end date logic
- [x] Unit tests cover all scenarios
- [x] DST boundaries handled correctly
- [x] Single-day events render once
- [x] Multi-day events render correct span
- [ ] Manual testing in staging with December 2025 holidays
- [ ] Production deployment

## Next Steps

1. **Deploy to Staging**: Test with real Google Calendar events
2. **Verify December 2025 Holidays**: Check that Christmas and other holidays appear correctly
3. **Monitor**: Watch for any regressions in vacation request display
4. **Deploy to Production**: After successful staging verification

## Related Issues

- Google Calendar uses exclusive end dates for all-day events (RFC 5545 standard)
- Our app uses inclusive end dates for consistency with vacation requests
- The fix ensures proper conversion between these formats

---

**Status**: ✅ Implementation Complete
**Tests**: ✅ All Passing (21/21)
**Next Action**: Deploy to staging and verify with real calendar events

