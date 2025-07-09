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
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'Not set');
  console.log('');
  
  // Test Simple Email Service (Ethereal)
  try {
    console.log('🧪 Testing Simple Email Service (Ethereal)...');
    
    // Import nodemailer directly
    const nodemailer = require('nodemailer');
    
    // Create a test account (for development)
    const testAccount = await nodemailer.createTestAccount();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: '"Vacation Management" <noreply@stars.mc>',
      to: 'pierre@stars.mc',
      subject: 'Test Email from Vacation Management',
      html: 'This is a test email from the vacation management system.',
    });

    console.log('✅ Simple email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('❌ Simple email service test failed:', error.message);
  }
  
  console.log('');
  
  // Test Gmail SMTP
  try {
    console.log('🧪 Testing Gmail SMTP...');
    
    if (!process.env.GMAIL_USER || !process.env.SMTP_PASSWORD) {
      console.log('⚠️  Gmail credentials not configured, skipping Gmail test');
      return;
    }
    
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: 'pierre@stars.mc',
      subject: 'Test Email from Vacation Management (Gmail)',
      html: 'This is a test email from the vacation management system via Gmail SMTP.',
    });

    console.log('✅ Gmail SMTP email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error.message);
  }
  
  console.log('');
  console.log('🎯 Check the console output above to see which email service is working.');
}

testEmail().catch(console.error); 