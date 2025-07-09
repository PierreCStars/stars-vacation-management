// Test sending emails to Johnny, Daniel, and Compta
require('ts-node/register');
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
        process.env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
      }
    }
  });
}

async function testAdminEmails() {
  console.log('🔍 Testing Admin Email Delivery...\n');
  
  const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
  const subject = 'Test Vacation Request Notification - All Admins';
  const body = `
Hello Admins,

This is a test email to verify that vacation request notifications are working properly for all admin recipients.

Test Details:
- Employee: Test User (test@stars.mc)
- Company: STARS_MC
- Type: Paid Vacation
- Start Date: 2025-07-15
- End Date: 2025-07-20
- Reason: Testing email delivery to all admins

Recipients:
- Pierre (pierre@stars.mc)
- Johnny (johnny@stars.mc)
- Daniel (daniel@stars.mc)
- Compta (compta@stars.mc)

Please confirm if you received this email.

Best regards,
Vacation Management System
  `.trim();

  try {
    const { sendEmailWithFallbacks } = require('./src/lib/simple-email-service');
    console.log('📧 Sending test email to all admins...');
    console.log('Recipients:', adminEmails.join(', '));
    
    const result = await sendEmailWithFallbacks(adminEmails, subject, body);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      if (result.previewUrl) {
        console.log('📧 Preview URL:', result.previewUrl);
      }
      console.log('');
      console.log('📋 Next Steps:');
      console.log('1. Check your email inbox (pierre@stars.mc)');
      console.log('2. Ask Johnny to check johnny@stars.mc');
      console.log('3. Ask Daniel to check daniel@stars.mc');
      console.log('4. Ask Compta to check compta@stars.mc');
      console.log('5. Confirm if they all received the email');
    } else {
      console.error('❌ Test email failed:', result.error);
      if (result.fallback) {
        console.log('📧 Fallback used:', result.fallback);
      }
    }
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
}

testAdminEmails(); 