# Email Notification Setup for Stars Vacation Management

## Overview
This system sends automatic email notifications to all admins when vacation requests are created, with conflict detection warnings.

## Environment Variables Required

### SMTP Configuration
Add these to your `.env.local` file and Vercel environment variables:

```bash
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=pierre@stars.mc
SMTP_PASS=your_app_password
SMTP_FROM=hr@stars.mc
FROM_EMAIL=hr@stars.mc

# App Configuration
APP_BASE_URL=http://localhost:3000  # or your production URL
APP_TIMEZONE=Europe/Monaco

# Admin Recipients
ADMIN_EMAILS=pierre@stars.mc
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication if not already enabled

### 2. Generate App Password
- Go to Google Account → Security → 2-Step Verification
- Click "App passwords" at the bottom
- Select "Mail" and "Other (Custom name)"
- Name it "Stars Vacation Management"
- Copy the generated 16-character password

### 3. Update Environment Variables
- Set `SMTP_PASS` to the generated app password
- Set `SMTP_USER` to pierre@stars.mc (for authentication)
- Set `SMTP_FROM` to hr@stars.mc (for sender display)
- Set `FROM_EMAIL` to hr@stars.mc (for email service)

## Vercel Deployment

### 1. Add Environment Variables
- Go to your Vercel project dashboard
- Navigate to Settings → Environment Variables
- Add all the environment variables listed above
- Set `APP_BASE_URL` to your production domain

### 2. Redeploy
- After adding environment variables, redeploy your application

## Features

### ✅ What Works Now
- **Admin Notifications**: All admins receive emails for new vacation requests
- **Conflict Detection**: Automatic detection of overlapping vacation dates
- **Conflict Warnings**: Email subjects and content include conflict alerts
- **Direct Review Links**: Emails contain direct links to review requests
- **Half-day Support**: Proper handling of morning/afternoon half-day requests

### 📧 Email Content
- Employee name and email
- Vacation dates and duration
- Half-day information (if applicable)
- Reason for vacation
- Company and type
- **Conflict warnings** (if overlaps detected)
- Direct review button linking to admin page

### ⚠️ Conflict Detection
- Checks against existing **pending** and **approved** requests
- Shows overlapping employee names, dates, and statuses
- Non-blocking (requests still submitted)
- Helps admins make informed decisions

## Testing

### 1. Test Email Delivery
- Submit a vacation request
- Check admin email inboxes
- Verify email content and formatting

### 2. Test Conflict Detection
- Create overlapping vacation requests
- Verify conflict warnings in emails
- Check conflict details in email body

### 3. Test Review Links
- Click "Review Request" button in emails
- Verify it leads to the correct admin page

## Troubleshooting

### Common Issues

#### "SMTP env vars missing" Error
- Ensure all SMTP environment variables are set
- Check for typos in variable names
- Verify values are not empty

#### Email Not Sending
- Check Gmail app password is correct
- Ensure 2FA is enabled on Gmail account
- Verify SMTP settings (host, port, security)

#### Conflicts Not Detected
- Check Firebase connection
- Verify vacation request data structure
- Check console logs for error messages

### Debug Mode
The system logs detailed information to help troubleshoot:
- Conflict detection results
- Email sending status
- Error details with stack traces

## Security Notes

- **No secrets in code**: All credentials stored in environment variables
- **Admin-only access**: Conflict detection and email sending require admin privileges
- **Gmail security**: Uses app passwords, not main account passwords
- **HTTPS required**: Production URLs must use HTTPS for security

## Next Steps

Once this system is working:
1. **Enable Firebase integration** for real data persistence
2. **Add email templates** for different notification types
3. **Implement status change notifications** (approved/rejected)
4. **Add email preferences** for admins
5. **Create notification dashboard** for admin review
