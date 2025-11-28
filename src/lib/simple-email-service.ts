import * as nodemailer from 'nodemailer';

// Simple email service using Nodemailer
export async function sendSimpleEmail(to: string[], subject: string, body: string) {
  try {
    console.log('📧 Attempting to send email via Ethereal (test service)...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    
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
      from: '"RH Stars" <rh@stars.mc>',
      replyTo: 'pierre@stars.mc',
      sender: 'rh@stars.mc',
      to: to.join(', '),
      subject: subject,
      html: body,
    });

    console.log('✅ Simple email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('❌ Simple email failed:', error);
    return { success: false, error };
  }
}

// Alternative: Use Gmail SMTP (if you have Gmail credentials)
export async function sendGmailSMTP(to: string[], subject: string, body: string) {
  try {
    console.log('📧 Attempting to send email via Gmail SMTP...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 Gmail User:', process.env.GMAIL_USER ? 'Set' : 'NOT SET');
    console.log('📧 SMTP Password:', process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET');
    console.log('📧 SMTP User:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
    console.log('📧 SMTP From:', process.env.SMTP_FROM ? 'Set' : 'NOT SET');
    
    // Try different environment variable combinations
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !smtpPassword) {
      console.error('❌ Gmail credentials not configured');
      console.error('❌ Gmail User:', gmailUser ? 'Set' : 'NOT SET');
      console.error('❌ SMTP Password:', smtpPassword ? 'Set' : 'NOT SET');
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
      from: '"RH Stars" <rh@stars.mc>',
      replyTo: 'pierre@stars.mc',
      sender: 'rh@stars.mc',
      to: to.join(', '),
      subject: subject,
      html: body,
    });

    console.log('✅ Gmail SMTP email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Gmail SMTP failed:', error);
    return { success: false, error };
  }
}

// Alternative: Use Resend (more reliable)
export async function sendResendEmail(to: string[], subject: string, body: string) {
  try {
    console.log('📧 Attempting to send email via Resend...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ Resend API key not configured');
      throw new Error('Resend API key not configured');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '"RH Stars" <rh@stars.mc>',
        replyTo: 'pierre@stars.mc',
        to: to,
        subject: subject,
        html: body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Resend email sent successfully');
    console.log('📧 Message ID:', result.id);
    
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Resend email failed:', error);
    return { success: false, error };
  }
}

// Custom SMTP (using environment variables)
export async function sendCustomSMTP(to: string[], subject: string, body: string) {
  try {
    console.log('📧 Attempting to send email via Custom SMTP...');
    console.log('📧 To:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    console.log('📧 SMTP Port:', process.env.SMTP_PORT);
    console.log('📧 SMTP User:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
    console.log('📧 SMTP From:', process.env.SMTP_FROM ? 'Set' : 'NOT SET');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: '"RH Stars" <rh@stars.mc>',
      replyTo: 'pierre@stars.mc',
      sender: 'rh@stars.mc',
      to: to.join(', '),
      subject,
      html: body,
    });

    console.log('✅ Custom SMTP email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (_error) {
    console.error('❌ Custom SMTP failed:', _error);
    return { success: false, error: _error };
  }
}

// Enhanced email service with multiple fallbacks
export async function sendEmailWithFallbacks(to: string[], subject: string, body: string) {
  console.log('📧 Starting email send with fallbacks...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);

  // Try Custom SMTP first
  try {
    const smtpResult = await sendCustomSMTP(to, subject, body);
    if (smtpResult.success) {
      console.log('✅ Email sent successfully via Custom SMTP');
      return smtpResult;
    }
  } catch {
    console.log('⚠️ Custom SMTP failed, trying Resend...');
  }

  // Try Resend next (most reliable)
  try {
    const resendResult = await sendResendEmail(to, subject, body);
    if (resendResult.success) {
      console.log('✅ Email sent successfully via Resend');
      return resendResult;
    }
  } catch {
    console.log('⚠️ Resend failed, trying Gmail SMTP...');
  }

  // Try Gmail SMTP
  try {
    const gmailResult = await sendGmailSMTP(to, subject, body);
    if (gmailResult.success) {
      console.log('✅ Email sent successfully via Gmail SMTP');
      return gmailResult;
    }
  } catch {
    console.log('⚠️ Gmail SMTP failed, trying Ethereal...');
  }

  // Try Ethereal (test service) as fallback - ONLY in development
  // In production, skip Ethereal as it doesn't send real emails
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  if (!isProduction) {
    try {
      const etherealResult = await sendSimpleEmail(to, subject, body);
      if (etherealResult.success) {
        console.log('⚠️ Email sent via Ethereal (TEST SERVICE - emails not delivered to real recipients)');
        console.log('📧 Preview URL:', etherealResult.previewUrl);
        console.log('⚠️ WARNING: This is a test service. Real emails were NOT sent!');
        // Return success but with a warning flag
        return {
          ...etherealResult,
          isTestService: true,
          warning: 'Email sent via test service (Ethereal). Real emails were NOT delivered.'
        };
      }
    } catch {
      console.log('⚠️ Ethereal failed...');
    }
  } else {
    console.log('⚠️ Skipping Ethereal test service in production environment');
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