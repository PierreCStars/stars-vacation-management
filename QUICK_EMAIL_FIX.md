# Quick Fix: compta@stars.mc Not Receiving Notifications

## Immediate Problem
`compta@stars.mc` is not receiving notifications because the Gmail app password is invalid, causing all emails to be sent to a test service instead of real recipients.

## Quick Solution (Choose One)

### Option 1: Fix Gmail App Password (Recommended)

1. **Generate new Gmail app password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and generate a new 16-character password

2. **Update the .env file**:
   ```bash
   # Replace the old password
   SMTP_PASSWORD=your_new_16_character_password
   ```

3. **Test immediately**:
   ```bash
   curl -X GET http://localhost:3000/api/test-email
   ```

### Option 2: Use Resend (Faster Setup)

1. **Sign up for Resend** (free tier available):
   - Go to: https://resend.com
   - Create account and get API key

2. **Add to .env file**:
   ```bash
   RESEND_API_KEY=your_resend_api_key_here
   ```

3. **Test immediately**:
   ```bash
   curl -X GET http://localhost:3000/api/test-email
   ```

## Verification Steps

After fixing the email configuration:

1. **Test email service**:
   ```bash
   curl -X GET http://localhost:3000/api/test-email
   ```
   Should show: `"success":true` and no Ethereal preview URL

2. **Submit a test vacation request** as any user

3. **Check that compta@stars.mc receives**:
   - Email notification about new request
   - Email notification when request is approved/rejected

4. **Check admin notifications**:
   - `pierre@stars.mc`, `johnny@stars.mc`, `daniel@stars.mc` should also receive notifications

## Current Email Recipients for compta@stars.mc

### New Vacation Requests
- **Recipients**: `compta@stars.mc`, `daniel@stars.mc`, `johnny@stars.mc`
- **Subject**: "🏖️ New Vacation Request - Action Required"

### Request Status Updates
- **Recipients**: `pierre@stars.mc`, `johnny@stars.mc`, `daniel@stars.mc`, `compta@stars.mc`
- **Subject**: "Vacation Request {APPROVED/REJECTED} - {employee_name}"

### Monthly CSV Reports
- **Recipients**: `compta@stars.mc`
- **Subject**: "{Month} Vacations"

## Expected Behavior After Fix

✅ `compta@stars.mc` receives email for every new vacation request
✅ `compta@stars.mc` receives email when any request is approved/rejected
✅ `compta@stars.mc` receives monthly CSV reports
✅ All other admin emails work properly
✅ Employee notifications work properly

## Troubleshooting

If emails still don't work after fixing:

1. **Check server logs** for email errors
2. **Verify .env file** is loaded correctly
3. **Restart development server** after changing .env
4. **Check spam folder** for test emails

## Current Status

- ❌ Gmail SMTP: FAILING (invalid password)
- ❌ Resend: NOT CONFIGURED
- ✅ Ethereal: WORKING (but only test service)
- ❌ Real emails: NOT SENT

**Result**: All notifications go to test service, no real emails delivered. 