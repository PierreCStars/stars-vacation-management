#!/usr/bin/env node

/**
 * Script to resend notification emails for pending vacation requests
 * This script fixes the issue where emails were pointing to localhost instead of production URLs
 */

const https = require('https');

const PRODUCTION_URL = 'https://starsvacationmanagementv2.vercel.app';

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'starsvacationmanagementv2.vercel.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ResendNotificationsScript/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function checkPendingRequests() {
  console.log('🔍 Checking pending vacation requests...');
  
  try {
    const response = await makeRequest('GET', '/api/resend-pending-notifications');
    
    if (response.status === 200 && response.data.success) {
      console.log(`📋 Found ${response.data.count} pending vacation requests:`);
      
      if (response.data.requests && response.data.requests.length > 0) {
        response.data.requests.forEach((request, index) => {
          console.log(`  ${index + 1}. ${request.userName} (${request.userEmail})`);
          console.log(`     Company: ${request.company}`);
          console.log(`     Dates: ${request.startDate} to ${request.endDate}`);
          console.log(`     Duration: ${request.durationDays} days`);
          console.log(`     Created: ${new Date(request.createdAt).toLocaleDateString()}`);
          console.log('');
        });
      } else {
        console.log('✅ No pending requests found - all caught up!');
      }
      
      return response.data.count;
    } else {
      console.error('❌ Failed to check pending requests:', response.data);
      return 0;
    }
  } catch (error) {
    console.error('❌ Error checking pending requests:', error.message);
    return 0;
  }
}

async function resendNotifications() {
  console.log('📧 Resending notification emails for pending vacation requests...');
  
  try {
    const response = await makeRequest('POST', '/api/resend-pending-notifications');
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Notification resend completed successfully!');
      console.log(`📊 Summary:`);
      console.log(`   - Processed: ${response.data.processed} requests`);
      console.log(`   - Emails sent: ${response.data.sent}`);
      console.log(`   - Errors: ${response.data.errors}`);
      
      if (response.data.errorDetails && response.data.errorDetails.length > 0) {
        console.log(`\n❌ Error details:`);
        response.data.errorDetails.forEach(error => {
          console.log(`   - ${error}`);
        });
      }
      
      return response.data.sent;
    } else {
      console.error('❌ Failed to resend notifications:', response.data);
      return 0;
    }
  } catch (error) {
    console.error('❌ Error resending notifications:', error.message);
    return 0;
  }
}

async function main() {
  console.log('🚀 Vacation Request Notification Resend Script');
  console.log('===============================================');
  console.log(`🌐 Production URL: ${PRODUCTION_URL}`);
  console.log('');

  // Check pending requests first
  const pendingCount = await checkPendingRequests();
  
  if (pendingCount === 0) {
    console.log('✅ No pending requests to process. Exiting.');
    return;
  }

  console.log('');
  console.log('📧 Proceeding to resend notifications...');
  console.log('');

  // Resend notifications
  const sentCount = await resendNotifications();
  
  console.log('');
  console.log('🎉 Script completed!');
  console.log(`📧 ${sentCount} notification emails sent with corrected URLs.`);
  console.log('');
  console.log('✅ All pending vacation request notifications now point to:');
  console.log('   https://starsvacationmanagementv2.vercel.app/fr/admin/vacation-requests/');
  console.log('   (instead of localhost URLs)');
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
