#!/usr/bin/env node

/**
 * Targeted 404 Reproduction Test
 * This script attempts to reproduce the exact 404 issue with max@stars.mc
 */

console.log('🎯 Targeted 404 Reproduction Test for max@stars.mc\n');

const baseUrl = 'http://localhost:3001';

// Test function to check specific endpoints
async function testEndpoint(endpoint, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`📡 Testing: ${method} ${endpoint}`);
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    const result = {
      endpoint,
      method,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries())
    };
    
    // Try to get response body for error details
    try {
      const text = await response.text();
      if (text) {
        result.body = text.substring(0, 200); // Limit body length
      }
    } catch (e) {
      result.bodyError = e.message;
    }
    
    return result;
  } catch (error) {
    return {
      endpoint,
      method,
      error: error.message,
      status: 'ERROR'
    };
  }
}

// Test specific scenarios that might cause 404
async function testSpecificScenarios() {
  console.log('🔍 Testing specific scenarios that might cause 404...\n');
  
  // Scenario 1: Test if there are any routes that expect email in path
  console.log('📋 Scenario 1: Testing potential email-in-path routes');
  const potentialEmailRoutes = [
    '/api/users/max@stars.mc',
    '/api/profile/max@stars.mc', 
    '/api/avatar/max@stars.mc',
    '/api/user/max@stars.mc',
    '/api/employee/max@stars.mc'
  ];
  
  for (const route of potentialEmailRoutes) {
    const result = await testEndpoint(route);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
  
  // Scenario 2: Test encoded email in path
  console.log('\n📋 Scenario 2: Testing encoded email in path');
  const encodedEmail = encodeURIComponent('max@stars.mc');
  const encodedRoutes = [
    `/api/users/${encodedEmail}`,
    `/api/profile/${encodedEmail}`,
    `/api/avatar/${encodedEmail}`,
    `/api/user/${encodedEmail}`,
    `/api/employee/${encodedEmail}`
  ];
  
  for (const route of encodedRoutes) {
    const result = await testEndpoint(route);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
  
  // Scenario 3: Test query parameters with email
  console.log('\n📋 Scenario 3: Testing query parameters with email');
  const queryRoutes = [
    '/api/users?email=max@stars.mc',
    '/api/profile?email=max@stars.mc',
    '/api/avatar?email=max@stars.mc',
    '/api/user?email=max@stars.mc',
    '/api/employee?email=max@stars.mc'
  ];
  
  for (const route of queryRoutes) {
    const result = await testEndpoint(route);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
  
  // Scenario 4: Test encoded query parameters
  console.log('\n📋 Scenario 4: Testing encoded query parameters');
  const encodedQueryRoutes = [
    `/api/users?email=${encodedEmail}`,
    `/api/profile?email=${encodedEmail}`,
    `/api/avatar?email=${encodedEmail}`,
    `/api/user?email=${encodedEmail}`,
    `/api/employee?email=${encodedEmail}`
  ];
  
  for (const route of encodedQueryRoutes) {
    const result = await testEndpoint(route);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
  
  // Scenario 5: Test POST requests with email in body
  console.log('\n📋 Scenario 5: Testing POST requests with email in body');
  const postRoutes = [
    '/api/users',
    '/api/profile', 
    '/api/avatar',
    '/api/user',
    '/api/employee'
  ];
  
  const testBody = { email: 'max@stars.mc' };
  
  for (const route of postRoutes) {
    const result = await testEndpoint(route, 'POST', testBody);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
}

// Test Next.js specific routing issues
async function testNextJsRouting() {
  console.log('\n🔍 Testing Next.js specific routing issues...\n');
  
  // Test if there are any dynamic routes that might be misconfigured
  const dynamicRoutes = [
    '/api/vacation-requests/max@stars.mc',
    '/api/vacation-requests/max%40stars.mc',
    '/api/admin/vacations/max@stars.mc',
    '/api/admin/vacations/max%40stars.mc'
  ];
  
  for (const route of dynamicRoutes) {
    const result = await testEndpoint(route);
    console.log(`  ${result.ok ? '✅' : '❌'} ${route}: ${result.status} ${result.statusText || result.error || ''}`);
    if (result.body) {
      console.log(`    Body: ${result.body}`);
    }
  }
}

// Test middleware and routing configuration
function testRoutingConfiguration() {
  console.log('\n🔍 Testing routing configuration...\n');
  
  // Check if there are any patterns that might cause issues
  const testUrls = [
    'http://localhost:3001/api/users/max@stars.mc',
    'http://localhost:3001/api/users/max%40stars.mc',
    'http://localhost:3001/api/profile/max@stars.mc',
    'http://localhost:3001/api/profile/max%40stars.mc'
  ];
  
  testUrls.forEach(url => {
    try {
      const parsed = new URL(url);
      console.log(`  URL: ${url}`);
      console.log(`    Pathname: ${parsed.pathname}`);
      console.log(`    Search: ${parsed.search}`);
      console.log(`    Hash: ${parsed.hash}`);
      console.log(`    Valid: ✅`);
    } catch (error) {
      console.log(`  URL: ${url}`);
      console.log(`    Error: ❌ ${error.message}`);
    }
  });
}

// Main test execution
async function runTargetedTests() {
  console.log('🚀 Starting targeted 404 reproduction tests...\n');
  
  await testSpecificScenarios();
  await testNextJsRouting();
  testRoutingConfiguration();
  
  console.log('\n' + '='.repeat(60));
  console.log('TARGETED TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n📋 Key Findings:');
  console.log('1. Check browser network tab for exact failing URL');
  console.log('2. Look for any frontend code that constructs URLs with email addresses');
  console.log('3. Verify that all email usage follows safe patterns');
  console.log('4. Check for any middleware or routing rules affecting @ or . characters');
  
  console.log('\n🔧 Next Steps:');
  console.log('- If 404 still occurs, check browser developer tools');
  console.log('- Look for any fetch() calls that embed email addresses in paths');
  console.log('- Ensure all email usage follows safe patterns (query params or POST body)');
  console.log('- Check for any custom routing or middleware that might affect URLs');
}

// Run the tests
runTargetedTests().catch(console.error);
