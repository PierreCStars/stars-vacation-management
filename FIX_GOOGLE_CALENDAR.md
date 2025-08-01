# Fix Google Calendar Integration

## Problem Identified
Approved vacation requests are not being displayed on the Google Calendar because the service account lacks "writer access" to the calendar.

## Current Status
- ✅ **Service Account**: Properly configured
- ✅ **Calendar Access**: Can read the calendar
- ❌ **Event Creation**: Permission denied - "You need to have writer access to this calendar"

## Solution: Grant Service Account Calendar Permissions

### Step 1: Access Google Calendar Settings

1. **Go to Google Calendar**: https://calendar.google.com/
2. **Find the Stars vacation calendar**: "Holidays" (c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com)
3. **Click the three dots** next to the calendar name
4. **Select "Settings and sharing"**

### Step 2: Add Service Account with Write Permissions

1. **Scroll down to "Share with specific people"**
2. **Click "Add people"**
3. **Add the service account email**:
   ```
   vacation-db@holiday-461710.iam.gserviceaccount.com
   ```
4. **Set permission to**: "Make changes to events"
5. **Click "Send"**

### Step 3: Verify the Fix

After granting permissions, test the calendar integration:

```bash
node test-google-calendar.cjs
```

You should see:
```
✅ Successfully created test event
✅ Successfully deleted test event
✅ Google Calendar integration is working correctly
```

## Alternative Solutions

### Option 1: Use a Different Calendar
If you can't modify the current calendar permissions, create a new calendar:

1. **Create new calendar** in Google Calendar
2. **Update the environment variable**:
   ```bash
   GOOGLE_CALENDAR_ID=your_new_calendar_id@group.calendar.google.com
   ```
3. **Add service account** with write permissions to the new calendar

### Option 2: Use Primary Calendar
Use the primary calendar of the service account:

```bash
GOOGLE_CALENDAR_ID=primary
```

## Expected Behavior After Fix

✅ **Approved vacation requests** automatically appear in Google Calendar
✅ **Events are color-coded** by company
✅ **Event details include** employee name, company, dates, and reason
✅ **Calendar events are visible** in the admin interface

## Calendar Event Details

When working correctly, each approved vacation will create an event with:
- **Title**: `{Employee Name} - {Company Name}`
- **Description**: Employee details, dates, and reason
- **Color**: Based on company (Stars MC = Blue, Stars Yachting = Green, etc.)
- **Duration**: From start date to end date (inclusive)

## Troubleshooting

### If Still Not Working

1. **Check service account permissions** in Google Calendar
2. **Verify calendar ID** is correct
3. **Test with a different calendar** temporarily
4. **Check Google Cloud Console** for API quotas and limits

### Common Issues

- **Permission denied**: Service account needs "Make changes to events" permission
- **Calendar not found**: Verify the calendar ID is correct
- **API quotas exceeded**: Check Google Cloud Console for usage limits

## Next Steps

1. **Grant write permissions** to the service account
2. **Test the integration** with the test script
3. **Approve a vacation request** to verify it appears in the calendar
4. **Check the calendar** to see the new event

The calendar integration will work once the service account has proper write permissions! 