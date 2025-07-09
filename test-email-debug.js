require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Email Configuration Debug');
console.log('============================');
console.log('GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET' : 'NOT SET');
console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NOT SET');
console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('');

async function testGmailSMTP() {
  try {
    console.log('📧 Testing Gmail SMTP...');
    
    // Try different environment variable combinations
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !smtpPassword) {
      console.error('❌ Gmail credentials not configured');
      return;
    }

    console.log('📧 Using credentials:');
    console.log('  User:', gmailUser);
    console.log('  Password:', smtpPassword ? 'SET' : 'NOT SET');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: smtpPassword,
      },
    });

    // Verify connection
    console.log('📧 Verifying connection...');
    await transporter.verify();
    console.log('✅ Connection verified successfully');

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || gmailUser,
      to: 'pierre@stars.mc',
      subject: 'Test Email from Vacation Management',
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from the vacation management system.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, the email configuration is working!</p>
      `,
    });

    console.log('✅ Test email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error.message);
    if (error.code === 'EAUTH') {
      console.error('❌ Authentication failed. Check your Gmail app password.');
      console.error('❌ Make sure you have 2FA enabled and generated an app password.');
    }
  }
}

async function testEthereal() {
  try {
    console.log('📧 Testing Ethereal (fallback)...');
    
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Test account created:', testAccount.user);

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"Test" <test@ethereal.email>',
      to: 'pierre@stars.mc',
      subject: 'Test Email via Ethereal',
      html: `
        <h2>Test Email via Ethereal</h2>
        <p>This is a test email sent via Ethereal (test service).</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    console.log('✅ Ethereal test email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    
  } catch (error) {
    console.error('❌ Ethereal test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting email tests...\n');
  
  await testGmailSMTP();
  console.log('');
  await testEthereal();
  
  console.log('\n🏁 Tests completed');
}

runTests().catch(console.error); 