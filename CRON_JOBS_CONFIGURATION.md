# Cron Jobs Configuration

## Overview

This project uses **2 Vercel Cron Jobs** (within the plan limit) to handle all scheduled tasks.

## Scheduled Cron Jobs (Vercel)

### 1. Daily Dispatcher (`/api/cron/daily-dispatcher`)
- **Schedule**: `0 8 * * *` (Daily at 08:00 UTC / 09:00 Europe/Monaco)
- **Purpose**: Handles all daily maintenance tasks
- **Tasks**:
  - **Pending Reminder (5d)**: Sends email reminders to admins for vacation requests pending longer than 5 days
  - **Cleanup Test Requests**: Removes test user (`test@stars.mc`) vacation requests older than 24 hours (optional, can be disabled via `TEST_USER_CLEANUP_ENABLED=false`)

### 2. Monthly Vacation Summary (`/api/cron/monthly-vacation-summary`)
- **Schedule**: `0 1 27 * *` (Monthly on the 27th at 01:00 UTC)
- **Purpose**: Sends monthly summary of validated vacations to accounting
- **Tasks**:
  - Fetches all validated/approved vacations taken in the current month
  - Generates HTML email with detailed table
  - Sends to `compta@stars.mc` (or `ACCOUNTING_EMAIL` env var)
  - Includes CSV data in email body

## Manual Endpoints (Not Scheduled)

The following endpoints exist but are **NOT** scheduled as Vercel cron jobs. They can be called manually via:
- Admin UI buttons
- Direct HTTP requests
- API calls

### Available Manual Endpoints:
- `/api/cron/pending-reminder-5d` - Can be triggered manually (now also runs via daily-dispatcher)
- `/api/cron/cleanup-test-requests` - Can be triggered manually (now also runs via daily-dispatcher)
- `/api/cron/monthly-csv` - Monthly CSV export (can be triggered manually)
- `/api/cron/check-pending-requests` - Diagnostic endpoint
- `/api/cron/pending-requests-3d` - 3-day reminder (if needed)
- `/api/cron/pending-requests-7d` - 7-day reminder (if needed)

## Why This Configuration?

### Problem
- Vercel plan allows maximum **2 cron jobs**
- Previous configuration had **3 cron jobs**:
  1. `pending-reminder-5d` (daily)
  2. `cleanup-test-requests` (daily)
  3. `monthly-vacation-summary` (monthly)

### Solution
- **Consolidated daily tasks** into a single `daily-dispatcher` cron job
- **Kept monthly task** separate (different schedule, critical business function)
- **Result**: 2 cron jobs total, all functionality preserved

## Future Scaling

If the Vercel plan is upgraded to allow more cron jobs:
- The daily dispatcher can be split back into separate cron jobs for better isolation
- Additional specialized cron jobs can be added (e.g., weekly reports, different reminder intervals)
- The consolidation logic can remain as a fallback option

## Environment Variables

- `TEST_USER_CLEANUP_ENABLED`: Set to `'false'` to disable test request cleanup (default: `true`)
- `ACCOUNTING_EMAIL`: Override default recipient for monthly summary (default: `compta@stars.mc`)
- `REMINDER_ENABLED`: Set to `'false'` to disable pending reminders (default: `true`)

## Testing

To test cron jobs manually:
```bash
# Test daily dispatcher
curl https://your-domain.vercel.app/api/cron/daily-dispatcher

# Test monthly summary (will only run on 27th, or use POST to bypass date check)
curl -X POST https://your-domain.vercel.app/api/cron/monthly-vacation-summary
```

## Files Modified

- `vercel.json`: Updated to only include 2 cron jobs
- `src/app/api/cron/daily-dispatcher/route.ts`: New consolidated daily dispatcher
- Original endpoints remain unchanged and can still be called manually

