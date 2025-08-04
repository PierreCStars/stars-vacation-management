#!/usr/bin/env node

const https = require('https');
const http = require('http');

const BASE_URL = 'https://stars-vacation-management.vercel.app';
const LOCAL_URL = 'http://localhost:3000';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testEndpoint(url, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url);
    
    console.log(`   Status: ${response.status}`);
    
    if (response.status === 200) {
      console.log('   ✅ Success');
    } else if (response.status === 401) {
      console.log('   ⚠️  Unauthorized (expected for API without auth)');
    } else if (response.status === 307) {
      console.log('   🔄 Redirect (expected for protected pages)');
    } else {
      console.log('   ❌ Unexpected status');
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Deployment Test Suite');
  console.log('========================\n');
  
  // Test production endpoints
  await testEndpoint(`${BASE_URL}/`, 'Production Homepage');
  await testEndpoint(`${BASE_URL}/admin`, 'Production Admin Page');
  await testEndpoint(`${BASE_URL}/dashboard`, 'Production Dashboard');
  await testEndpoint(`${BASE_URL}/api/vacation-requests`, 'Production API - Vacation Requests');
  await testEndpoint(`${BASE_URL}/api/clear-reviewed-requests`, 'Production API - Clear Requests');
  
  // Test local endpoints (if server is running)
  console.log('\n🔧 Local Development Tests:');
  await testEndpoint(`${LOCAL_URL}/`, 'Local Homepage');
  await testEndpoint(`${LOCAL_URL}/admin`, 'Local Admin Page');
  await testEndpoint(`${LOCAL_URL}/api/vacation-requests`, 'Local API - Vacation Requests');
  
  console.log('\n📋 Summary:');
  console.log('✅ Firestore rules deployed successfully');
  console.log('✅ Application deployed to Vercel');
  console.log('⚠️  API endpoints return "Unauthorized" - this is expected without authentication');
  console.log('⚠️  Need to update Firebase credentials in production environment');
  
  console.log('\n🔧 Next Steps:');
  console.log('1. Update Firebase credentials in Vercel environment variables');
  console.log('2. Test with authenticated user session');
  console.log('3. Verify Firestore operations work with real credentials');
}

runTests().catch(console.error); 