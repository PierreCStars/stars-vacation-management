#!/usr/bin/env node

/**
 * 404 Investigation Script for max@stars.mc Email Issue
 * This script tests various API endpoints to identify the root cause
 */

console.log('🔍 Investigating 404 issue for max@stars.mc emails...\n');

const testEmails = [
  'max@stars.mc',
  'test@example.com', 
  'user@domain.com',
  'pierre@stars.mc'
];

const baseUrl = 'http://localhost:3001';

// Test function to check API endpoints
async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    
    return {
      endpoint,
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      url: response.url
    };
  } catch (error) {
    return {
      endpoint,
      error: error.message,
      status: 'ERROR'
    };
  }
}

// Test function to check if email is properly encoded in URLs
function testEmailEncoding(email) {
  console.log(`\n📧 Testing email encoding for: ${email}`);
  
  const encoded = encodeURIComponent(email);
  const decoded = decodeURIComponent(encoded);
  
  console.log(`  Raw email: ${email}`);
  console.log(`  Encoded: ${encoded}`);
  console.log(`  Decoded: ${decoded}`);
  console.log(`  Match: ${email === decoded ? '✅' : '❌'}`);
  
  return {
    email,
    encoded,
    decoded,
    matches: email === decoded
  };
}

// Test API endpoints that might be affected
async function testApiEndpoints() {
  console.log('\n🌐 Testing API endpoints...');
  
  const endpoints = [
    '/api/vacation-requests',
    '/api/health',
    '/api/auth/signin',
    '/api/avatar?url=https://lh3.googleusercontent.com/a/test',
    '/api/debug-env'
  ];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    console.log(`  ${result.ok ? '✅' : '❌'} ${endpoint}: ${result.status} ${result.statusText || result.error || ''}`);
  }
}

// Test vacation request creation with different emails
async function testVacationRequestCreation() {
  console.log('\n📝 Testing vacation request creation...');
  
  for (const email of testEmails) {
    console.log(`\n  Testing with email: ${email}`);
    
    const testData = {
      startDate: '2024-02-01',
      endDate: '2024-02-03',
      company: 'STARS_MC',
      type: 'PAID_LEAVE',
      reason: 'Test vacation request',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 3
    };
    
    const result = await testEndpoint('/api/vacation-requests', 'POST', testData);
    console.log(`    Status: ${result.status} ${result.statusText || result.error || ''}`);
  }
}

// Test admin vacation creation with different emails
async function testAdminVacationCreation() {
  console.log('\n👑 Testing admin vacation creation...');
  
  for (const email of testEmails) {
    console.log(`\n  Testing with email: ${email}`);
    
    const testData = {
      firstName: 'Max',
      lastName: 'Test',
      phone: '1234567890',
      email: email,
      companyId: 'STARS_MC',
      startDate: '2024-02-01',
      endDate: '2024-02-03',
      vacationType: 'PAID_LEAVE'
    };
    
    const result = await testEndpoint('/api/admin/vacations', 'POST', testData);
    console.log(`    Status: ${result.status} ${result.statusText || result.error || ''}`);
  }
}

// Test URL construction patterns
function testUrlPatterns() {
  console.log('\n🔗 Testing URL construction patterns...');
  
  const patterns = [
    // Pattern 1: Direct email in path (BAD)
    (email) => `/api/users/${email}`,
    
    // Pattern 2: Encoded email in path (BETTER)
    (email) => `/api/users/${encodeURIComponent(email)}`,
    
    // Pattern 3: Email in query string (GOOD)
    (email) => `/api/users?email=${encodeURIComponent(email)}`,
    
    // Pattern 4: Email in POST body (BEST)
    (email) => `/api/users`
  ];
  
  for (const email of testEmails) {
    console.log(`\n  Email: ${email}`);
    
    patterns.forEach((pattern, index) => {
      const url = pattern(email);
      console.log(`    Pattern ${index + 1}: ${url}`);
    });
  }
}

// Test specific problematic patterns
function testProblematicPatterns() {
  console.log('\n⚠️ Testing potentially problematic patterns...');
  
  const problematicEmails = [
    'max@stars.mc',
    'user@domain.com',
    'test+tag@example.com',
    'user.name@domain.co.uk'
  ];
  
  problematicEmails.forEach(email => {
    console.log(`\n  Email: ${email}`);
    
    // Test if the email contains characters that might cause routing issues
    const hasAt = email.includes('@');
    const hasDot = email.includes('.');
    const hasPlus = email.includes('+');
    const hasHyphen = email.includes('-');
    
    console.log(`    Contains @: ${hasAt ? '⚠️' : '✅'}`);
    console.log(`    Contains .: ${hasDot ? '⚠️' : '✅'}`);
    console.log(`    Contains +: ${hasPlus ? '⚠️' : '✅'}`);
    console.log(`    Contains -: ${hasHyphen ? '⚠️' : '✅'}`);
    
    // Test encoding
    const encoded = encodeURIComponent(email);
    console.log(`    Encoded: ${encoded}`);
    
    // Test if encoded version would cause issues
    const wouldCauseIssues = encoded.includes('%40') || encoded.includes('%2E');
    console.log(`    Would cause routing issues: ${wouldCauseIssues ? '❌' : '✅'}`);
  });
}

// Main test execution
async function runTests() {
  console.log('🚀 Starting 404 investigation tests...\n');
  
  // Test 1: Email encoding
  console.log('='.repeat(50));
  console.log('TEST 1: Email Encoding');
  console.log('='.repeat(50));
  testEmails.forEach(testEmailEncoding);
  
  // Test 2: URL patterns
  console.log('\n' + '='.repeat(50));
  console.log('TEST 2: URL Construction Patterns');
  console.log('='.repeat(50));
  testUrlPatterns();
  
  // Test 3: Problematic patterns
  console.log('\n' + '='.repeat(50));
  console.log('TEST 3: Problematic Email Patterns');
  console.log('='.repeat(50));
  testProblematicPatterns();
  
  // Test 4: API endpoints
  console.log('\n' + '='.repeat(50));
  console.log('TEST 4: API Endpoint Testing');
  console.log('='.repeat(50));
  await testApiEndpoints();
  
  // Test 5: Vacation request creation
  console.log('\n' + '='.repeat(50));
  console.log('TEST 5: Vacation Request Creation');
  console.log('='.repeat(50));
  await testVacationRequestCreation();
  
  // Test 6: Admin vacation creation
  console.log('\n' + '='.repeat(50));
  console.log('TEST 6: Admin Vacation Creation');
  console.log('='.repeat(50));
  await testAdminVacationCreation();
  
  console.log('\n' + '='.repeat(50));
  console.log('INVESTIGATION COMPLETE');
  console.log('='.repeat(50));
  
  console.log('\n📋 Summary:');
  console.log('1. Check if any API endpoints use email addresses in URL paths');
  console.log('2. Verify that email addresses are properly encoded when used in URLs');
  console.log('3. Look for any middleware or routing rules that might affect @ or . characters');
  console.log('4. Test with actual max@stars.mc email to reproduce the 404');
  console.log('\n🔧 Next steps:');
  console.log('- If 404 occurs, check browser network tab for exact failing URL');
  console.log('- Look for any fetch() calls that embed email addresses in paths');
  console.log('- Ensure all email usage follows safe patterns (query params or POST body)');
}

// Run the tests
runTests().catch(console.error);
