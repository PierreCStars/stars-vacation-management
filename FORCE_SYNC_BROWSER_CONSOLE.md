# Force Sync - Browser Console Command (Fixed)

## The Issue

If you're getting a 404 error, it means:
1. The server isn't running (for local)
2. The route isn't deployed (for production)
3. You're on the wrong URL

## Fixed Browser Console Command

Use this improved version with better error handling:

```javascript
fetch('/api/sync/approved-requests', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(async (response) => {
  console.log('📊 Status:', response.status, response.statusText);
  
  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Error Response:', text);
    throw new Error(`HTTP ${response.status}: ${text.substring(0, 100)}`);
  }
  
  return response.json();
})
.then(data => {
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
})
.catch(error => {
  console.error('❌ Sync Failed:', error);
  console.error('💡 Troubleshooting:');
  console.error('   1. Make sure the server is running (npm run dev)');
  console.error('   2. Check the URL is correct');
  console.error('   3. Check the Network tab for the actual error');
});
```

## Alternative: Check if Endpoint Exists First

```javascript
// First, check if the endpoint exists
fetch('/api/sync/approved-requests', {
  method: 'OPTIONS'
})
.then(r => {
  console.log('Endpoint check:', r.status);
  if (r.status === 404) {
    console.error('❌ Endpoint not found!');
    console.error('   Make sure you are on the correct URL');
    console.error('   Local: http://localhost:3000');
    console.error('   Production: https://vacation.stars.mc');
  } else {
    console.log('✅ Endpoint exists, running sync...');
    // Now run the actual sync
    return fetch('/api/sync/approved-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  }
})
.then(r => r && r.json())
.then(data => {
  if (data) {
    console.log('✅ Sync Result:', data);
  }
})
.catch(error => {
  console.error('❌ Error:', error);
});
```

## Quick Test: Verify Server is Running

```javascript
// Test if the server is responding
fetch('/api/health')
.then(r => r.json())
.then(data => {
  console.log('✅ Server is running:', data);
})
.catch(error => {
  console.error('❌ Server not responding:', error);
  console.error('   Start the server with: npm run dev');
});
```

## If 404 Persists

1. **Check the URL**: Make sure you're on the correct domain
   - Local: `http://localhost:3000`
   - Production: `https://vacation.stars.mc`

2. **Check Network Tab**: 
   - Open DevTools → Network tab
   - Run the fetch command
   - Check the actual request URL and response

3. **Verify Route Exists**:
   - The route should be at: `src/app/api/sync/approved-requests/route.ts`
   - Make sure the file exists and exports a `POST` function

4. **Restart Server** (if local):
   ```bash
   # Stop the server (Ctrl+C)
   npm run dev
   ```

5. **Check Build** (if production):
   - The route might not be deployed
   - Check Vercel deployment logs

## Alternative Endpoints to Try

If `/api/sync/approved-requests` doesn't work, try:

1. **Individual Request Sync**:
```javascript
// Replace REQUEST_ID with actual ID
fetch('/api/sync/request/REQUEST_ID', {
  method: 'POST'
})
.then(r => r.json())
.then(console.log);
```

2. **Check Available Endpoints**:
```javascript
// Try to list available endpoints (if you have a health/status endpoint)
fetch('/api/health')
.then(r => r.json())
.then(console.log);
```
