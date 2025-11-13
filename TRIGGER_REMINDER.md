# How to Trigger the 5-Day Pending Reminder

## Production API Endpoint

The reminder can be triggered manually via the production API endpoint:

### Option 1: Using curl (Recommended)

```bash
# Replace with your actual production URL
curl -X POST https://starsvacationmanagementv2.vercel.app/api/cron/pending-reminder-5d
```

Or using GET:
```bash
curl https://starsvacationmanagementv2.vercel.app/api/cron/pending-reminder-5d
```

### Option 2: Using Vercel CLI

If you have Vercel CLI installed:

```bash
# Login to Vercel
vercel login

# Trigger the endpoint
vercel env pull .env.production
curl -X POST $(grep VERCEL_URL .env.production | cut -d '=' -f2)/api/cron/pending-reminder-5d
```

### Option 3: Via Browser

Simply visit the endpoint in your browser (GET request):
```
https://starsvacationmanagementv2.vercel.app/api/cron/pending-reminder-5d
```

### Option 4: Using the Script (Local Development)

If you want to test locally (requires Firebase Admin to be enabled):

```bash
npx tsx scripts/trigger-pending-reminder.ts
```

**Note**: This requires `NEXT_PUBLIC_ENABLE_FIREBASE=true` in your `.env.local` file.

## Expected Response

### Success Response (with pending requests):
```json
{
  "success": true,
  "message": "Reminder sent for 3 pending requests",
  "totalPending": 5,
  "included": 3,
  "excluded": 2,
  "notified": 2,
  "errors": 0,
  "timestamp": "2025-11-12T15:00:00.000Z"
}
```

### Success Response (no pending requests):
```json
{
  "success": true,
  "message": "No pending requests need reminder",
  "totalPending": 0,
  "included": 0,
  "excluded": 0,
  "notified": 0,
  "errors": 0,
  "timestamp": "2025-11-12T15:00:00.000Z"
}
```

### Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2025-11-12T15:00:00.000Z"
}
```

## What Happens When Triggered

1. **Finds Pending Requests**: Queries Firestore for requests with `status = 'pending'`
2. **Filters by Last Reminder**: Only includes requests where:
   - `lastRemindedAt` is `null` (never reminded), OR
   - `lastRemindedAt` is more than 5 days ago
3. **Sends Email**: Composes and sends HTML email to all active admins with:
   - Table of pending requests (employee, dates, type, days, submitted date)
   - Review links for each request
   - Call-to-action button
4. **Updates Timestamps**: Sets `lastRemindedAt` for all included requests (idempotency)

## Configuration

### Environment Variables

- `REMINDER_ENABLED`: Set to `'false'` to disable reminders (default: `true`)
- `NEXTAUTH_URL` or `VERCEL_URL`: Used for generating review links in emails

### Feature Flag

The reminder respects the `REMINDER_ENABLED` environment variable. If set to `'false'`, the reminder will not send emails but will return a success response indicating it's disabled.

## Automatic Schedule

The reminder also runs automatically via Vercel Cron:
- **Schedule**: Daily at 08:00 UTC (09:00 Europe/Monaco)
- **Cron Expression**: `0 8 * * *`
- **Note**: The code checks if 5 days have passed, so reminders only send when appropriate

## Troubleshooting

### No Emails Sent

1. Check `REMINDER_ENABLED` is not set to `'false'`
2. Verify there are pending requests that haven't been reminded in the last 5 days
3. Check admin email configuration
4. Review server logs for errors

### Firebase Admin Not Available

If you see "Firebase Admin not available" error:
- Ensure `NEXT_PUBLIC_ENABLE_FIREBASE=true` in production
- Verify Firebase service account credentials are configured
- Check Vercel environment variables

### Email Delivery Issues

- Verify SMTP configuration in Vercel environment variables
- Check email service provider logs
- Ensure admin email addresses are valid

