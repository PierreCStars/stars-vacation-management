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
    
    // Validate required environment variables
    if (!process.env.SMTP_HOST) {
      throw new Error('SMTP_HOST is not configured');
    }
    if (!process.env.SMTP_USER) {
      throw new Error('SMTP_USER is not configured');
    }
    if (!process.env.SMTP_PASSWORD) {
      throw new Error('SMTP_PASSWORD is not configured');
    }
    
    console.log('📧 SMTP Host:', process.env.SMTP_HOST);
    console.log('📧 SMTP Port:', process.env.SMTP_PORT || '587 (default)');
    console.log('📧 SMTP User:', process.env.SMTP_USER);
    console.log('📧 SMTP From:', process.env.SMTP_FROM || 'rh@stars.mc (default)');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"RH Stars" <rh@stars.mc>',
      replyTo: 'pierre@stars.mc',
      sender: process.env.SMTP_FROM || 'rh@stars.mc',
      to: to.join(', '),
      subject,
      html: body,
    });

    console.log('✅ Custom SMTP email sent successfully');
    console.log('📧 Message ID:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (_error) {
    const errorMsg = _error instanceof Error ? _error.message : String(_error);
    console.error('❌ Custom SMTP failed:', errorMsg);
    return { success: false, error: _error };
  }
}

// Enhanced email service with multiple fallbacks
export async function sendEmailWithFallbacks(to: string[], subject: string, body: string) {
  console.log('📧 Starting email send with fallbacks...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);

  const errors: Array<{ service: string; error: unknown }> = [];

  // Check environment variables for diagnostics
  console.log('📧 Email service configuration check:');
  console.log('   - SMTP_HOST:', process.env.SMTP_HOST ? 'Set' : 'NOT SET');
  console.log('   - SMTP_USER:', process.env.SMTP_USER ? 'Set' : 'NOT SET');
  console.log('   - SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET');
  console.log('   - RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'NOT SET');
  console.log('   - GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'NOT SET');
  console.log('   - NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   - VERCEL:', process.env.VERCEL || 'not set');

  // Try Custom SMTP first
  try {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const smtpResult = await sendCustomSMTP(to, subject, body);
      if (smtpResult.success) {
        console.log('✅ Email sent successfully via Custom SMTP');
        return { ...smtpResult, provider: 'Custom SMTP' };
      } else {
        const errorMsg = smtpResult.error instanceof Error ? smtpResult.error.message : String(smtpResult.error);
        console.error('❌ Custom SMTP failed:', errorMsg);
        errors.push({ service: 'Custom SMTP', error: smtpResult.error });
      }
    } else {
      console.log('⚠️ Custom SMTP skipped (missing configuration)');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Custom SMTP exception:', errorMsg);
    errors.push({ service: 'Custom SMTP', error });
  }

  // Try Resend next (most reliable)
  try {
    if (process.env.RESEND_API_KEY) {
      const resendResult = await sendResendEmail(to, subject, body);
      if (resendResult.success) {
        console.log('✅ Email sent successfully via Resend');
        return { ...resendResult, provider: 'Resend' };
      } else {
        const errorMsg = resendResult.error instanceof Error ? resendResult.error.message : String(resendResult.error);
        console.error('❌ Resend failed:', errorMsg);
        errors.push({ service: 'Resend', error: resendResult.error });
      }
    } else {
      console.log('⚠️ Resend skipped (RESEND_API_KEY not set)');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Resend exception:', errorMsg);
    errors.push({ service: 'Resend', error });
  }

  // Try Gmail SMTP
  try {
    const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD;
    if (gmailUser && smtpPassword) {
      const gmailResult = await sendGmailSMTP(to, subject, body);
      if (gmailResult.success) {
        console.log('✅ Email sent successfully via Gmail SMTP');
        return { ...gmailResult, provider: 'Gmail SMTP' };
      } else {
        const errorMsg = gmailResult.error instanceof Error ? gmailResult.error.message : String(gmailResult.error);
        console.error('❌ Gmail SMTP failed:', errorMsg);
        errors.push({ service: 'Gmail SMTP', error: gmailResult.error });
      }
    } else {
      console.log('⚠️ Gmail SMTP skipped (missing credentials)');
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Gmail SMTP exception:', errorMsg);
    errors.push({ service: 'Gmail SMTP', error });
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
          warning: 'Email sent via test service (Ethereal). Real emails were NOT delivered.',
          provider: 'Ethereal (Test)'
        };
      } else {
        const errorMsg = etherealResult.error instanceof Error ? etherealResult.error.message : String(etherealResult.error);
        console.error('❌ Ethereal failed:', errorMsg);
        errors.push({ service: 'Ethereal', error: etherealResult.error });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Ethereal exception:', errorMsg);
      errors.push({ service: 'Ethereal', error });
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
  console.log('=== FAILURE SUMMARY ===');
  errors.forEach(({ service, error }) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`   ${service}: ${errorMsg}`);
  });
  console.log('========================');

  return {
    success: false,
    error: 'All email services failed',
    fallback: 'Logged to console',
    errors: errors.map(({ service, error }) => ({
      service,
      error: error instanceof Error ? error.message : String(error)
    }))
  };
} 