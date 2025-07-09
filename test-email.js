// Test email functionality
// Load environment variables manually
const fs = require('fs');
const path = require('path');

// Simple .env parser
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      const value = valueParts.join('=').trim();
      if (value) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}

async function testEmail() {
  console.log('🔍 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📧 Environment Variables:');
  console.log('GMAIL_USER:', process.env.GMAIL_USER || 'Not set');
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set');
  console.log('GMAIL_FROM_EMAIL:', process.env.GMAIL_FROM_EMAIL || 'Not set');
  console.log('GOOGLE_SERVICE_ACCOUNT_KEY:', process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'Set' : 'Not set');
  console.log('');
  
  // Test Gmail API
  try {
    const { sendEmail } = require('./src/lib/gmail-service');
    console.log('🧪 Testing Gmail API...');
    await sendEmail(['pierre@stars.mc'], 'Test Email', 'This is a test email from the vacation management system.');
    console.log('✅ Gmail API test completed');
  } catch (error) {
    console.error('❌ Gmail API test failed:', error.message);
  }
  
  console.log('');
  
  // Test Simple Email Service
  try {
    const { sendSimpleEmail } = require('./src/lib/simple-email-service');
    console.log('🧪 Testing Simple Email Service...');
    const result = await sendSimpleEmail(['pierre@stars.mc'], 'Test Email (Simple)', 'This is a test email from the simple email service.');
    if (result.success) {
      console.log('✅ Simple email service test completed');
      if (result.previewUrl) {
        console.log('📧 Preview URL:', result.previewUrl);
      }
    } else {
      console.error('❌ Simple email service test failed');
    }
  } catch (error) {
    console.error('❌ Simple email service test failed:', error.message);
  }
  
  console.log('');
  console.log('🎯 Recommendation: Check the console output above to see which email service is working.');
}

testEmail().catch(console.error); 