// Simple email test script - JavaScript version
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🧪 Testing email service...');
  
  // Check environment variables
  console.log('📧 Environment check:');
  console.log('  GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'NOT SET');
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'NOT SET');
  console.log('  SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
  
  const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
  const testSubject = '🧪 Test Email - Vacation Management System';
  const testBody = `
    <html>
      <body>
        <h2>Test Email</h2>
        <p>This is a test email to verify that the email notification system is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toISOString()}</p>
        <p>If you receive this email, the notification system is working properly.</p>
        <p><strong>Recipients:</strong> ${adminEmails.join(', ')}</p>
      </body>
    </html>
  `;

  // Try Gmail SMTP first (most likely to work)
  if (process.env.GMAIL_USER && process.env.SMTP_PASSWORD) {
    try {
      console.log('📧 Trying Gmail SMTP...');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      console.log('📧 Sending test email via Gmail...');
      const info = await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: adminEmails,
        subject: testSubject,
        html: testBody,
      });

      console.log('✅ Gmail email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Check your email inboxes for the test message.');
      return;
      
    } catch (error) {
      console.log('❌ Gmail SMTP failed:', error.message);
      console.log('🔍 Trying custom SMTP...');
    }
  }

  // Try custom SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    try {
      console.log('📧 Trying custom SMTP...');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      console.log('📧 Sending test email via custom SMTP...');
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: adminEmails,
        subject: testSubject,
        html: testBody,
      });

      console.log('✅ Custom SMTP email sent successfully!');
      console.log('📧 Message ID:', info.messageId);
      console.log('📧 Check your email inboxes for the test message.');
      return;
      
    } catch (error) {
      console.log('❌ Custom SMTP failed:', error.message);
    }
  }

  // Fallback to Ethereal (test service)
  try {
    console.log('📧 Trying Ethereal (test service)...');
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    console.log('📧 Sending test email via Ethereal...');
    const info = await transporter.sendMail({
      from: '"Vacation Management" <noreply@stars.mc>',
      to: adminEmails,
      subject: testSubject,
      html: testBody,
    });

    console.log('✅ Ethereal email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('⚠️  This is a test service - emails won\'t reach real inboxes');
    
  } catch (error) {
    console.log('❌ All email services failed:', error.message);
    console.log('🔍 Please check your email configuration in .env file');
  }
}

testSMTP().catch(console.error); 