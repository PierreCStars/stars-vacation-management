# Stars Vacation Management System

A comprehensive vacation request management system built with Next.js, Firebase, and Google Calendar integration.

## Features

- **User Authentication**: Google OAuth integration with @stars.mc domain restriction
- **Vacation Request Management**: Submit, review, and track vacation requests
- **Admin Dashboard**: Comprehensive admin interface for managing requests
- **Email Notifications**: Automatic email notifications for new requests and status updates
- **Google Calendar Integration**: Automatic calendar event creation for approved requests
- **Monthly CSV Export**: Automated monthly reports sent to compta@stars.mc

## Monthly CSV Export Feature

The system automatically exports reviewed vacation requests to CSV format and sends them to `compta@stars.mc` on the last day of each month.

### How it works:

1. **Automatic Trigger**: The system checks daily if it's the last day of the month
2. **Data Collection**: Gathers all reviewed requests (APPROVED/REJECTED) for the current month
3. **CSV Generation**: Creates a comprehensive CSV file with all request details
4. **Email Delivery**: Sends the report to `compta@stars.mc` with subject "{Month Name} Vacations"

### Manual Export:

Admins can also manually trigger CSV exports:
- Go to the Admin Dashboard
- Click the "📄 Export CSV" button
- The current month's data will be sent to `compta@stars.mc`

### CSV Content:

The exported CSV includes:
- Employee details (ID, email, name)
- Request details (dates, reason, type, company)
- Status information (approved/rejected)
- Admin review details (reviewer, review date, comments)

### Cron Job Setup:

To enable automatic monthly exports, set up a cron job to call:
```
GET /api/cron/monthly-csv
```

Example cron job (runs daily at 9 AM):
```bash
0 9 * * * curl -X GET https://your-domain.com/api/cron/monthly-csv
```

## Admin Access

The following users have admin access:
- `pierre@stars.mc`
- `johnny@stars.mc`
- `daniel@stars.mc`
- `compta@stars.mc`

## Email Notifications

All admins receive notifications for:
- New vacation requests
- Status updates (approved/rejected)

`compta@stars.mc` additionally receives:
- Monthly CSV reports

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`

## Environment Variables

Required environment variables:
- `NEXTAUTH_SECRET`
- `GOOGLE_ID`
- `GOOGLE_SECRET`
- Firebase configuration
- Email service configuration

## Deployment

The application is deployed on Vercel and automatically updates on git push.

## Support

For issues or questions, contact the development team.
