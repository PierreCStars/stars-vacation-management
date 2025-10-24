# Auth Debug Guide

This guide helps debug authentication issues in the Stars Vacation Management System.

## Overview

The system uses NextAuth.js with Google OAuth for authentication. Access is controlled through:
1. **Admin List**: Hardcoded list in `src/config/admins.ts`
2. **Policy-based Allowlist**: Environment variable configuration

## Environment Variables

### Required Variables
```bash
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Optional Policy Variables
```bash
# Domain-based allowlist (e.g., allow all @stars.mc emails)
NEXTAUTH_ALLOW_DOMAIN=stars.mc

# Email-based allowlist (comma-separated)
NEXTAUTH_ALLOW_EMAILS=person@stars.mc,admin@stars.mc,external@example.com
```

## Error Page

The system now includes a proper error page at `/auth/error` that handles:
- **AccessDenied**: User not in allowlist
- **Configuration**: Server configuration issues
- **Verification**: Token verification failures
- **Default**: Generic authentication errors

## Testing Steps

### 1. Verify Error Page
```bash
# Test locally
curl http://localhost:3000/auth/error?error=AccessDenied

# Test on Vercel
curl https://your-domain.vercel.app/auth/error?error=AccessDenied
```

Expected: User-friendly error page with proper styling and navigation.

### 2. Test Authentication Flow

#### Test Allowed Email (Should Succeed)
1. Go to `/auth/signin`
2. Sign in with an allowed email (admin list or policy)
3. Should redirect to dashboard successfully

#### Test Disallowed Email (Should Show Error)
1. Go to `/auth/signin`
2. Sign in with a disallowed email
3. Should redirect to `/auth/error?error=AccessDenied`

### 3. Test Policy Configuration

#### Domain-based Policy
```bash
# Set environment variable
NEXTAUTH_ALLOW_DOMAIN=stars.mc

# Test emails:
# ✅ user@stars.mc (should work)
# ❌ user@other.com (should fail)
```

#### Email-based Policy
```bash
# Set environment variable
NEXTAUTH_ALLOW_EMAILS=person@stars.mc,admin@stars.mc,external@example.com

# Test emails:
# ✅ person@stars.mc (should work)
# ✅ external@example.com (should work)
# ❌ other@stars.mc (should fail)
```

### 4. Check Logs

#### Vercel Logs
```bash
# Check Vercel function logs for structured auth logs
vercel logs --follow
```

Look for:
- `[auth] signIn granted` - Successful authentication
- `[auth] signIn denied` - Failed authentication with reason
- `[auth] authorized denied` - Authorization failures

#### Local Development
```bash
# Run development server and check console
npm run dev
```

## Common Issues

### 1. AccessDenied Error
**Symptoms**: User redirected to `/auth/error?error=AccessDenied`

**Causes**:
- Email not in admin list (`src/config/admins.ts`)
- Email not matching policy (domain or email allowlist)
- Policy misconfiguration

**Debug Steps**:
1. Check Vercel logs for `[auth] signIn denied` entries
2. Verify email is in admin list or policy
3. Check environment variables in Vercel dashboard
4. Test with known working email

### 2. Configuration Error
**Symptoms**: User redirected to `/auth/error?error=Configuration`

**Causes**:
- Missing environment variables
- Invalid Google OAuth configuration
- NextAuth configuration issues

**Debug Steps**:
1. Check all required environment variables are set
2. Verify Google OAuth credentials
3. Check NextAuth configuration syntax

### 3. Verification Error
**Symptoms**: User redirected to `/auth/error?error=Verification`

**Causes**:
- Expired or invalid tokens
- Session corruption
- Clock synchronization issues

**Debug Steps**:
1. Clear browser cookies/session
2. Check system clock synchronization
3. Verify NEXTAUTH_SECRET is consistent

## Logging Format

All authentication events are logged with structured data:

### Successful Sign-in
```json
{
  "level": "info",
  "message": "[auth] signIn granted",
  "reason": "admin_list|policy|development_mode",
  "email": "user@example.com",
  "isAdmin": true,
  "isPolicyAllowed": true,
  "provider": "google",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Failed Sign-in
```json
{
  "level": "warn",
  "message": "[auth] signIn denied",
  "reason": "policy",
  "email": "user@example.com",
  "isAdmin": false,
  "isPolicyAllowed": false,
  "allowDomain": "stars.mc",
  "allowEmails": ["admin@stars.mc"],
  "provider": "google",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Authorization Failures
```json
{
  "level": "warn",
  "message": "[auth] authorized denied",
  "url": "https://app.example.com/protected-page",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Policy Configuration Examples

### Allow Only Stars Monte Carlo Domain
```bash
NEXTAUTH_ALLOW_DOMAIN=stars.mc
```

### Allow Specific Emails
```bash
NEXTAUTH_ALLOW_EMAILS=pierre@stars.mc,johnny@stars.mc,daniel@stars.mc,compta@stars.mc
```

### Allow Domain + Specific External Emails
```bash
NEXTAUTH_ALLOW_DOMAIN=stars.mc
NEXTAUTH_ALLOW_EMAILS=external@partner.com,contractor@agency.com
```

### Development Mode (No Policy)
```bash
# Leave both unset for development
# NEXTAUTH_ALLOW_DOMAIN=
# NEXTAUTH_ALLOW_EMAILS=
```

## Troubleshooting Checklist

- [ ] Error page renders correctly at `/auth/error`
- [ ] All required environment variables are set in Vercel
- [ ] Google OAuth credentials are valid
- [ ] Admin emails are in `src/config/admins.ts`
- [ ] Policy environment variables are configured correctly
- [ ] Logs show structured authentication events
- [ ] Allowed emails can sign in successfully
- [ ] Disallowed emails get proper error page
- [ ] No hard redirects to missing pages

## Support

If issues persist:
1. Check Vercel function logs for detailed error messages
2. Verify environment variables in Vercel dashboard
3. Test with a known working email address
4. Check Google OAuth configuration in Google Cloud Console
5. Review NextAuth.js documentation for advanced configuration
