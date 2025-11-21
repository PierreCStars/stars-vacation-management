#!/usr/bin/env node

/**
 * Script to check a specific vacation request and verify its calendar sync status
 * Usage: node check-vacation-request.cjs 9cvcfGrFqicZFNPxkffQ
 */

const requestId = process.argv[2] || '9cvcfGrFqicZFNPxkffQ';

console.log(`\n🔍 Checking vacation request: ${requestId}\n`);
console.log('📡 Calling diagnostic endpoint...\n');

// Use fetch to call the API endpoint
const fetch = require('node-fetch');

const baseUrl = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : process.env.NEXTAUTH_URL || 'https://vacation.stars.mc';

const url = `${baseUrl}/api/sync/request/${requestId}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log('📊 Diagnostic Results:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.syncStatus) {
      console.log('\n📈 Sync Status:');
      console.log(`  Needs Sync: ${data.syncStatus.needsSync ? '✅ YES' : '❌ NO'}`);
      console.log(`  Needs Recreate: ${data.syncStatus.needsRecreate ? '✅ YES' : '❌ NO'}`);
      console.log(`  Is Synced: ${data.syncStatus.isSynced ? '✅ YES' : '❌ NO'}`);
    }
    
    if (data.calendarEventExists === false) {
      console.log('\n⚠️  Event ID exists in Firestore but event NOT found in Google Calendar');
      console.log('   This is a stale event ID - the event was deleted or never created');
    }
    
    if (data.syncStatus?.needsSync || data.syncStatus?.needsRecreate) {
      console.log('\n💡 To fix: Run force sync');
      console.log(`   curl -X POST ${baseUrl}/api/sync/request/${requestId}`);
    }
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Try calling the endpoint directly:');
    console.log(`   curl ${url}`);
  });

