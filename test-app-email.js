require('dotenv').config();
const nodemailer = require('nodemailer');

// Copy the email service logic here for testing
async function sendEmailWithFallbacks(to, subject, body) {
  console.log('📧 Starting email send with fallbacks...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  
  // Try Gmail SMTP first
  try {
    console.log('📧 Attempting to send email via Gmail SMTP...');
    
    // Try different environment variable combinations
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !smtpPassword) {
      console.error('❌ Gmail credentials not configured');
      throw new Error('Gmail credentials not configured');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: smtpPassword,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || gmailUser,
      to: to.join(', '),
      subject: subject,
      html: body,
    });

    console.log('✅ Gmail SMTP email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.log('⚠️ Gmail SMTP failed, trying Ethereal...');
    console.error('❌ Gmail SMTP failed:', error.message);
  }

  // Try Ethereal (test service) as fallback
  try {
    console.log('📧 Attempting to send email via Ethereal (test service)...');
    
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

    const info = await transporter.sendMail({
      from: '"Vacation Management" <noreply@stars.mc>',
      to: to.join(', '),
      subject: subject,
      html: body,
    });

    console.log('✅ Ethereal email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.log('⚠️ Ethereal failed...');
    console.error('❌ Ethereal failed:', error.message);
  }

  // Final fallback: console log
  console.log('❌ All email services failed, logging to console:');
  console.log('=== EMAIL NOTIFICATION ===');
  console.log('To:', to.join(', '));
  console.log('Subject:', subject);
  console.log('Body:', body);
  console.log('========================');
  
  return { 
    success: false, 
    error: 'All email services failed',
    fallback: 'Logged to console'
  };
}

async function testAppEmail() {
  console.log('🚀 Testing email from application...');
  
  try {
    const result = await sendEmailWithFallbacks(
      ['pierre@stars.mc'],
      'Test Email from Vacation Management App',
      `
        <h2>Test Email from App</h2>
        <p>This is a test email sent from the vacation management application.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, the app email system is working!</p>
      `
    );
    
    console.log('📧 Email result:', result);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      if (result.previewUrl) {
        console.log('📧 Preview URL:', result.previewUrl);
        console.log('📧 Check this URL to see the email content');
      }
    } else {
      console.log('❌ Email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAppEmail(); 