// Test Gmail SMTP functionality
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

async function testGmailSMTP() {
  console.log('🔍 Testing Gmail SMTP...\n');
  
  console.log('📧 Environment Variables:');
  console.log('GMAIL_USER:', process.env.GMAIL_USER || 'Not set');
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set');
  console.log('');
  
  try {
    const { sendGmailSMTP } = require('./src/lib/simple-email-service');
    console.log('🧪 Testing Gmail SMTP...');
    const result = await sendGmailSMTP(['pierre@stars.mc'], 'Test Email (Gmail SMTP)', 'This is a test email sent via Gmail SMTP from the vacation management system.');
    
    if (result.success) {
      console.log('✅ Gmail SMTP test completed successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 Email should be delivered to your inbox');
    } else {
      console.error('❌ Gmail SMTP test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error.message);
  }
}

testGmailSMTP().catch(console.error); 