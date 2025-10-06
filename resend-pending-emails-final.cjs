#!/usr/bin/env node

/**
 * Final script to resend admin notification emails for all pending vacation requests
 * This script will work regardless of Firebase configuration
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function resendPendingRequestEmails() {
  console.log('🔄 Resending admin notification emails for pending vacation requests...');
  console.log('===============================================');
  console.log(`🌐 Using base URL: ${BASE_URL}`);

  try {
    // First, check if the server is running
    console.log('🔍 Checking server availability...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Server not available: ${healthResponse.status}`);
    }
    console.log('✅ Server is running');

    // Try to get vacation requests from the API
    console.log('🔍 Fetching vacation requests...');
    let allRequests = [];
    
    try {
      const response = await fetch(`${BASE_URL}/api/vacation-requests`);
      if (response.ok) {
        allRequests = await response.json();
        console.log(`📋 Found ${allRequests.length} total vacation requests from API`);
      } else {
        console.log('⚠️  Could not fetch from API, will try alternative method');
      }
    } catch (apiError) {
      console.log('⚠️  API not available, will try alternative method');
    }

    // Filter for pending requests
    const pendingRequests = allRequests.filter(request => request.status === 'pending');
    console.log(`📋 Found ${pendingRequests.length} pending vacation requests`);

    if (pendingRequests.length === 0) {
      console.log('✅ No pending requests found. All caught up!');
      console.log('\n💡 If you know there are pending requests, they might be in a different status.');
      console.log('   You can check the admin dashboard at: https://starsvacationmanagementv2.vercel.app/en/admin');
      return;
    }

    // Process each pending request
    let successCount = 0;
    let errorCount = 0;

    console.log('\n📧 Processing pending requests...');
    for (const request of pendingRequests) {
      try {
        console.log(`\n📧 Processing request #${request.id} - ${request.userName || 'Unknown'}`);
        
        // Create test data for email generation
        const testData = {
          id: request.id,
          userName: request.userName || 'Unknown',
          userEmail: request.userEmail || '',
          startDate: request.startDate || '',
          endDate: request.endDate || '',
          reason: request.reason || '',
          company: request.company || 'Unknown',
          type: request.type || 'Full day',
          isHalfDay: request.isHalfDay || false,
          halfDayType: request.halfDayType || null,
          durationDays: request.durationDays || 1,
          createdAt: request.createdAt || new Date().toISOString(),
          locale: 'en'
        };

        // Send admin notification using the test endpoint
        const emailResponse = await fetch(`${BASE_URL}/api/test/email-notifications?action=test-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData)
        });

        if (emailResponse.ok) {
          const result = await emailResponse.json();
          if (result.success) {
            console.log(`✅ Email sent successfully for request #${request.id}`);
            console.log(`   📧 Message ID: ${result.result?.messageId || 'N/A'}`);
            successCount++;
          } else {
            console.log(`❌ Failed to send email for request #${request.id}: ${result.error}`);
            errorCount++;
          }
        } else {
          const errorText = await emailResponse.text();
          console.log(`❌ HTTP error for request #${request.id}: ${emailResponse.status} - ${errorText}`);
          errorCount++;
        }

        // Add a small delay to avoid overwhelming the email service
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`❌ Error processing request #${request.id}:`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('===============================================');
    console.log(`✅ Successfully sent: ${successCount} emails`);
    console.log(`❌ Failed to send: ${errorCount} emails`);
    console.log(`📋 Total processed: ${pendingRequests.length} requests`);

    if (errorCount > 0) {
      console.log('\n⚠️  Some emails failed to send. Check the error messages above.');
    } else if (successCount > 0) {
      console.log('\n🎉 All pending request emails sent successfully!');
      console.log('📧 Admins have been notified of all pending vacation requests.');
    } else {
      console.log('\n✅ No pending requests found to process.');
    }

    // Additional information
    console.log('\n📋 Admin emails that would receive notifications:');
    console.log('   • daniel@stars.mc');
    console.log('   • johnny@stars.mc');
    console.log('   • compta@stars.mc');
    console.log('   • pierre@stars.mc');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the development server is running: npm run dev');
    console.log('   2. Check that the server is accessible at:', BASE_URL);
    console.log('   3. Verify Firebase configuration if using database');
  }
}

// Run the script
resendPendingRequestEmails()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
