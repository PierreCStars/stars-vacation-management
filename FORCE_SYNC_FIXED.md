# Force Sync - Fixed Browser Console Command

## The Problem

You're getting:
- `404` error - Endpoint not found
- `SyntaxError: The string did not match the expected pattern` - Trying to parse HTML (404 page) as JSON

## Solution: Use This Fixed Command

Copy and paste this into your browser console:

```javascript
(async () => {
  try {
    console.log('🔄 Starting sync...');
    
    const response = await fetch('/api/sync/approved-requests', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    // Check if response is OK
    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Error Response (not JSON):', text.substring(0, 200));
      
      if (response.status === 404) {
        console.error('💡 404 Error - Endpoint not found');
        console.error('   Possible causes:');
        console.error('   1. Server is not running (run: npm run dev)');
        console.error('   2. Wrong URL (check current URL in address bar)');
        console.error('   3. Route not deployed (check Vercel deployment)');
        console.error('   4. Build issue (check server logs)');
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse JSON response
    const data = await response.json();
    
    console.log('✅ Sync Complete!');
    console.log('📊 Summary:');
    console.log('   Total Approved:', data.totalApproved || 0);
    console.log('   ✅ Synced:', data.synced || 0);
    console.log('   ⏭️  Already Synced:', data.skipped || 0);
    console.log('   ❌ Failed:', data.failed || 0);
    
    if (data.errors && data.errors.length > 0) {
      console.warn('❌ Errors:', data.errors);
    }
    
    if (data.message) {
      console.log('💬', data.message);
    }
    
    return data;
    
  } catch (error) {
    console.error('❌ Sync Failed:', error.message);
    console.error('Full error:', error);
    return null;
  }
})();
```

## Quick Diagnostic: Check if Server is Running

Run this first to verify the server is responding:

```javascript
fetch('/api/health')
  .then(r => {
    if (r.ok) {
      return r.json();
    } else {
      throw new Error(`Server responded with ${r.status}`);
    }
  })
  .then(data => {
    console.log('✅ Server is running:', data);
  })
  .catch(error => {
    console.error('❌ Server not responding:', error);
    console.error('   Start the server with: npm run dev');
  });
```

## Alternative: Check Current URL

```javascript
console.log('Current URL:', window.location.href);
console.log('Base URL:', window.location.origin);
console.log('Expected endpoint:', window.location.origin + '/api/sync/approved-requests');
```

## If 404 Persists

### For Local Development:

1. **Make sure server is running**:
   ```bash
   npm run dev
   ```

2. **Check the URL**:
   - Should be: `http://localhost:3000`
   - Not: `http://127.0.0.1:3000` (might cause CORS issues)

3. **Check Network Tab**:
   - Open DevTools → Network tab
   - Run the fetch command
   - Look at the actual request URL
   - Check if it's being redirected or blocked

4. **Verify Route File Exists**:
   - File should exist: `src/app/api/sync/approved-requests/route.ts`
   - Make sure it exports a `POST` function

### For Production:

1. **Check Vercel Deployment**:
   - Verify the route is deployed
   - Check deployment logs for build errors

2. **Try Full URL**:
   ```javascript
   fetch('https://vacation.stars.mc/api/sync/approved-requests', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' }
   })
   .then(r => r.json())
   .then(console.log)
   .catch(console.error);
   ```

## Alternative: Use Individual Request Sync

If the bulk sync endpoint doesn't work, try syncing individual requests:

```javascript
// Replace REQUEST_ID with an actual vacation request ID
const REQUEST_ID = 'your-request-id-here';

fetch(`/api/sync/request/${REQUEST_ID}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(async (r) => {
  if (!r.ok) {
    const text = await r.text();
    console.error('Error:', text);
    throw new Error(`HTTP ${r.status}`);
  }
  return r.json();
})
.then(data => {
  console.log('✅ Sync Result:', data);
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

## Next Steps

1. **Run the diagnostic command** above to check if server is running
2. **Check the Network tab** to see the actual request/response
3. **Verify the route file exists** at `src/app/api/sync/approved-requests/route.ts`
4. **Check server logs** for any errors
5. **Try the alternative individual sync** if bulk sync doesn't work
