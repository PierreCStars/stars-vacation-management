// Test vacation request notification to all admins
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

async function testVacationRequestNotification() {
  console.log('🔍 Testing Vacation Request Notification to All Admins...\n');
  
  const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
  const subject = 'New Vacation Request - Test User';
  
  // Simulate the exact email format used in the vacation request API
  const startDate = new Date().toLocaleDateString();
  const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();
  const baseUrl = 'http://localhost:3000';
  const adminUrl = `${baseUrl}/admin/vacation-requests`;
  
  const emailBody = `
Hello Admins,<br><br>

Test User / STARS_MC has submitted a vacation request from ${startDate} to ${endDate}.<br><br>

If comments were added, find them below:<br>This is a test vacation request to verify all admins receive notifications.<br><br>

Review this submission by clicking here: <a href="${adminUrl}">${adminUrl}</a>
  `.trim();

  try {
    const { sendEmailWithFallbacks } = require('./src/lib/simple-email-service');
    console.log('📧 Sending vacation request notification to all admins...');
    console.log('Recipients:', adminEmails.join(', '));
    console.log('Subject:', subject);
    
    const result = await sendEmailWithFallbacks(adminEmails, subject, emailBody);
    
    if (result.success) {
      console.log('✅ Vacation request notification sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      if (result.previewUrl) {
        console.log('📧 Preview URL:', result.previewUrl);
      }
      console.log('');
      console.log('📋 Verification Steps:');
      console.log('1. Check your email inbox (pierre@stars.mc)');
      console.log('2. Ask Johnny to check johnny@stars.mc');
      console.log('3. Ask Daniel to check daniel@stars.mc');
      console.log('4. Ask Compta to check compta@stars.mc');
      console.log('5. Confirm they all received the vacation request notification');
      console.log('');
      console.log('📧 Email Content Preview:');
      console.log('Subject:', subject);
      console.log('Body:', emailBody.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''));
    } else {
      console.error('❌ Vacation request notification failed:', result.error);
      if (result.fallback) {
        console.log('📧 Fallback used:', result.fallback);
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVacationRequestNotification(); 