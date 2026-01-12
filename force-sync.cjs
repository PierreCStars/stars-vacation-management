#!/usr/bin/env node

/**
 * Force sync all approved vacation requests to Google Calendar
 * This script calls the /api/sync/approved-requests endpoint
 */

const https = require('https');
const http = require('http');

// Get base URL from environment or use localhost
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 
                 process.env.VERCEL_URL || 
                 'http://localhost:3000';

const SYNC_ENDPOINT = `${BASE_URL}/api/sync/approved-requests`;

console.log('🔄 Forcing sync of all approved vacation requests to Google Calendar...\n');
console.log(`📡 Endpoint: ${SYNC_ENDPOINT}\n`);

// Determine if URL is https or http
const url = new URL(SYNC_ENDPOINT);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for large syncs
};

const req = client.request(SYNC_ENDPOINT, options, (res) => {
  let data = '';

  console.log(`📊 Status: ${res.statusCode} ${res.statusMessage}`);
  console.log('─'.repeat(80));

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (res.statusCode === 200 && result.success) {
        console.log('✅ Sync completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   Total Approved Requests: ${result.totalApproved || 0}`);
        console.log(`   ✅ Successfully Synced: ${result.synced || 0}`);
        console.log(`   ⏭️  Already Synced (Skipped): ${result.skipped || 0}`);
        console.log(`   ❌ Failed: ${result.failed || 0}`);
        
        if (result.errors && result.errors.length > 0) {
          console.log('\n❌ Errors:');
          result.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. Request ${error.id}: ${error.error}`);
          });
        }
        
        console.log(`\n💬 Message: ${result.message || 'Sync completed'}`);
        console.log('\n✅ Check your Google Calendar to see the synced events!');
      } else {
        console.error('❌ Sync failed!\n');
        console.error('Error:', result.error || 'Unknown error');
        if (result.details) {
          console.error('Details:', result.details);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error);
      console.error('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.error('\n💡 Make sure the server is running:');
    console.error('   - For local: npm run dev');
    console.error('   - For production: Check VERCEL_URL or NEXT_PUBLIC_APP_URL');
  }
  process.exit(1);
});

req.on('timeout', () => {
  console.error('❌ Request timed out (5 minutes)');
  console.error('   The sync may still be running on the server.');
  req.destroy();
  process.exit(1);
});

req.end();
