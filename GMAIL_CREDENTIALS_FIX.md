# Gmail Credentials Fix - Invalid Login Error

## Problem

You're seeing this error:
```
Invalid login: 535-5.7.8 Username and Password not accepted
```

This means:
- ✅ Email configuration is detected correctly
- ✅ SMTP provider is available
- ❌ Gmail is rejecting the credentials (app password is invalid/expired)

## Solution: Generate a New Gmail App Password

### Step 1: Go to Google Account Settings
1. Visit: https://myaccount.google.com/
2. Sign in with `pierre@stars.mc`

### Step 2: Enable 2-Step Verification (if not already enabled)
1. Go to **Security** → **2-Step Verification**
2. Enable it if not already enabled
3. Gmail app passwords require 2FA to be enabled

### Step 3: Generate New App Password
1. Go to **Security** → **2-Step Verification**
2. Scroll down to **App passwords**
3. Click **Generate** (or select existing and regenerate)
4. Select:
   - **App**: Mail
   - **Device**: Other (Custom name)
   - **Name**: "Stars Vacation Management"
5. Click **Generate**
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### Step 4: Update Vercel Environment Variable
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `SMTP_PASS` (or `SMTP_PASSWORD`)
3. Update the value with the new 16-character app password
4. **Important**: Remove spaces if any (use: `abcdefghijklmnop`)
5. Make sure it's set for **Production** environment
6. Save

### Step 5: Redeploy
After updating the environment variable, Vercel will automatically redeploy. Or trigger a manual redeploy.

### Step 6: Test
Try sending the monthly email again. The error should be resolved.

## Why This Happens

Gmail app passwords can become invalid if:
- 2-Step Verification is disabled
- The app password is deleted/regenerated
- The password expires (rare, but possible)
- Too many failed login attempts

## Verification

After updating, check the diagnostic endpoint:
```
https://your-app.vercel.app/api/debug/email-config
```

You should see:
- `hasCustomSMTP: true`
- `hasAnyProvider: true`

And when sending emails, you should see:
- `✅ Email sent successfully via Custom SMTP`

Instead of:
- `❌ Invalid login: 535-5.7.8 Username and Password not accepted`

## Alternative: Use Resend

If Gmail continues to have issues, consider using Resend:

1. Sign up at https://resend.com
2. Get your API key
3. Add to Vercel: `RESEND_API_KEY=re_xxxxxxxxxxxxx`
4. The system will automatically use Resend instead of Gmail SMTP

Resend is more reliable and doesn't require app passwords.

