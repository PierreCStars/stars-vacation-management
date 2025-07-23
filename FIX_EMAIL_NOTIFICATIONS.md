# Fix Email Notifications Issue

## Problem Identified
When admins approve or reject vacation requests, **no one is notified** because the Gmail SMTP authentication is failing. The system falls back to Ethereal (a test email service) which doesn't actually send emails to real recipients.

## Root Cause
The Gmail app password in the `.env` file is invalid or has expired:
- Current password: `shjdlvftiqhxpadq`
- Error: "535-5.7.8 Username and Password not accepted"

## Solution: Update Gmail App Password

### Step 1: Generate a New Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** > **2-Step Verification**
3. Scroll down to **App passwords**
4. Click **Generate** for a new app password
5. Select **Mail** as the app type
6. Copy the 16-character password

### Step 2: Update the Environment Variable

Update the `.env` file with the new app password:

```bash
# Replace the old password with the new one
SMTP_PASSWORD=your_new_16_character_app_password
```

### Step 3: Test the Email Service

Run the test script to verify the fix:

```bash
node test-gmail-smtp.cjs
```

You should see:
```
✅ SMTP connection verified successfully!
✅ Test email sent successfully!
```

### Step 4: Restart the Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## Alternative Solutions

### Option 1: Use Resend Email Service (Recommended)

If Gmail continues to have issues, consider using Resend:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Add to `.env`:
   ```bash
   RESEND_API_KEY=your_resend_api_key
   ```

### Option 2: Use Custom SMTP Server

If you have access to a different SMTP server:

```bash
SMTP_HOST=your_smtp_server.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASSWORD=your_password
SMTP_FROM=your_email@domain.com
```

## Verification

After fixing the email configuration:

1. **Test the email service**: `curl -X GET http://localhost:3000/api/test-email`
2. **Submit a test vacation request**
3. **Approve it as an admin**
4. **Check that the employee receives an email notification**

## Expected Behavior After Fix

- ✅ Employees receive email notifications when their requests are approved/rejected
- ✅ Admin team receives notifications about request status changes
- ✅ New vacation requests trigger admin notifications
- ✅ Monthly CSV reports are sent to compta@stars.mc

## Current Email Recipients

### Employee Notifications
- Sent to: `{employee_email}` (from the vacation request)
- Subject: "Vacation Request {APPROVED/REJECTED} - {employee_name}"

### Admin Notifications
- Sent to: `pierre@stars.mc`, `johnny@stars.mc`, `daniel@stars.mc`, `compta@stars.mc`
- Subject: "Vacation Request {APPROVED/REJECTED} - {employee_name}"

### New Request Notifications
- Sent to: `compta@stars.mc`, `daniel@stars.mc`, `johnny@stars.mc`
- Subject: "🏖️ New Vacation Request - Action Required"

## Troubleshooting

### If Gmail Still Doesn't Work

1. **Check 2-Step Verification**: Ensure it's enabled on the Gmail account
2. **Check App Password**: Make sure you're using an app password, not the regular password
3. **Check Account Security**: Ensure the account hasn't been locked due to suspicious activity
4. **Try Different Email**: Consider using a different Gmail account for sending

### If No Emails Are Sent

1. Check server logs for email service errors
2. Verify environment variables are loaded correctly
3. Test the email service endpoint: `/api/test-email`
4. Check if the email service is being called in the vacation request approval process

## Important Notes

- The email service has multiple fallbacks (Custom SMTP → Resend → Gmail SMTP → Ethereal)
- Currently, it's falling back to Ethereal because Gmail authentication fails
- Ethereal is a test service that doesn't send real emails
- Once Gmail is fixed, all notifications will work properly 