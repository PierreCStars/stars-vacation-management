# Email URL Safety Migration Guide

## Problem
Some frontend code was constructing URLs with email addresses in the path, causing 404 errors:
- `/api/users/max@stars.mc` ❌ (404 Not Found)
- `/api/profile/user@domain.com` ❌ (404 Not Found)

## Solution
Use safe URL construction patterns that put email addresses in query parameters or request bodies:
- `/api/users?email=max%40stars.mc` ✅ (200 OK)
- `POST /api/users` with `{"email": "max@stars.mc"}` ✅ (200 OK)

## Migration Steps

### 1. Replace Direct URL Construction
```typescript
// ❌ BAD - Email in path
const url = `/api/users/${email}`;
fetch(url);

// ✅ GOOD - Email in query parameter
const url = `/api/users?email=${encodeURIComponent(email)}`;
fetch(url);

// ✅ BETTER - Use SafeUrlBuilder
const url = SafeUrlBuilder.buildUrlWithEmail('/api/users', email);
fetch(url);
```

### 2. Replace Fetch Calls
```typescript
// ❌ BAD - Email in path
fetch(`/api/profile/${userEmail}`);

// ✅ GOOD - Email in query parameter
fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`);

// ✅ BETTER - Use SafeApiClient
SafeApiClient.getWithEmail('/api/profile', userEmail);
```

### 3. Replace POST Requests
```typescript
// ❌ BAD - Email in URL path
fetch(`/api/users/${email}`, {
  method: 'POST',
  body: JSON.stringify(data)
});

// ✅ GOOD - Email in request body
fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...data, email })
});

// ✅ BETTER - Use SafeApiClient
SafeApiClient.postWithEmail('/api/users', email, data);
```

## Testing
Run the comprehensive test suite to ensure all email URL constructions are safe:
```bash
npm test -- --testPathPattern=email-url-safety
```

## Prevention
- Always use `SafeUrlBuilder` for URL construction with email addresses
- Always use `SafeApiClient` for API calls with email addresses
- Never put email addresses directly in URL paths
- Always validate email format before using in URLs
