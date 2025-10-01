/**
 * Test script for email notifications
 * Run with: node test-email-notifications.cjs
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testEmailNotifications() {
  console.log('🧪 Testing Email Notifications');
  console.log('================================');
  
  try {
    // Test 1: Get configuration
    console.log('\n1. Testing email configuration...');
    const configResponse = await fetch(`${BASE_URL}/api/test/email-notifications?action=config`);
    const configData = await configResponse.json();
    
    if (configData.success) {
      console.log('✅ Configuration retrieved successfully');
      console.log('📧 Admin emails:', configData.config.adminEmails);
      console.log('📧 From email:', configData.config.fromEmail);
      console.log('📧 Has Resend key:', configData.config.hasResendKey);
      console.log('📧 Has SMTP config:', configData.config.hasSmtpConfig);
      console.log('📧 App base URL:', configData.config.appBaseUrl);
    } else {
      console.log('❌ Failed to get configuration:', configData.error);
      return;
    }

    // Test 2: Test simple email
    console.log('\n2. Testing simple email...');
    const simpleResponse = await fetch(`${BASE_URL}/api/test/email-notifications?action=test-simple&email=test@example.com`);
    const simpleData = await simpleResponse.json();
    
    if (simpleData.success) {
      console.log('✅ Simple email test completed');
      console.log('📧 Provider:', simpleData.result.provider);
      console.log('📧 Success:', simpleData.result.success);
      if (simpleData.result.error) {
        console.log('⚠️ Error:', simpleData.result.error);
      }
    } else {
      console.log('❌ Simple email test failed:', simpleData.error);
    }

    // Test 3: Test admin notification
    console.log('\n3. Testing admin notification...');
    const adminResponse = await fetch(`${BASE_URL}/api/test/email-notifications?action=test-admin&email=admin@example.com`);
    const adminData = await adminResponse.json();
    
    if (adminData.success) {
      console.log('✅ Admin notification test completed');
      console.log('📧 Provider:', adminData.result.provider);
      console.log('📧 Success:', adminData.result.success);
      console.log('🔗 Admin URL:', adminData.adminUrl);
      if (adminData.result.error) {
        console.log('⚠️ Error:', adminData.result.error);
      }
    } else {
      console.log('❌ Admin notification test failed:', adminData.error);
    }

    // Test 4: Test confirmation email
    console.log('\n4. Testing confirmation email...');
    const confirmationResponse = await fetch(`${BASE_URL}/api/test/email-notifications?action=test-confirmation&email=user@example.com`);
    const confirmationData = await confirmationResponse.json();
    
    if (confirmationData.success) {
      console.log('✅ Confirmation email test completed');
      console.log('📧 Provider:', confirmationData.result.provider);
      console.log('📧 Success:', confirmationData.result.success);
      if (confirmationData.result.error) {
        console.log('⚠️ Error:', confirmationData.result.error);
      }
    } else {
      console.log('❌ Confirmation email test failed:', confirmationData.error);
    }

    console.log('\n🎉 Email notification tests completed!');
    console.log('\nNext steps:');
    console.log('1. Check your email inbox for test messages');
    console.log('2. Verify admin URLs work correctly');
    console.log('3. Test with real vacation request submission');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testEmailNotifications();