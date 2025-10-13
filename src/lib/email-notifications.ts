/**
 * Email notification service for vacation requests
 * Supports multiple email providers with fallbacks
 */

import nodemailer from 'nodemailer';

export interface EmailConfig {
  subject: string;
  html: string;
  text?: string;
  to: string[];
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

/**
 * Get admin email recipients from environment
 */
export function getAdminEmails(): string[] {
  const adminEmails = process.env.NOTIFY_ADMIN_EMAILS || process.env.ADMIN_EMAILS;
  if (!adminEmails) {
    console.warn('⚠️ No admin emails configured, using fallback');
    return ['pierre@stars.mc']; // Fallback
  }
  
  return adminEmails
    .split(',')
    .map(email => email.trim())
    .filter(Boolean);
}

/**
 * Get sender email from environment
 */
export function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'rh@stars.mc';
}

/**
 * Send email via Resend API
 */
export async function sendViaResend(config: EmailConfig): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
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
        to: config.to,
        subject: config.subject,
        html: config.html,
        text: config.text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    return {
      success: true,
      messageId: result.id,
      provider: 'resend'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: 'resend'
    };
  }
}

/**
 * Send email via SMTP
 */
export async function sendViaSMTP(config: EmailConfig): Promise<EmailResult> {
  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !pass) {
      throw new Error('SMTP configuration incomplete');
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: '"RH Stars" <rh@stars.mc>',
      replyTo: 'pierre@stars.mc',
      sender: 'rh@stars.mc',
      to: config.to.join(', '),
      subject: config.subject,
      html: config.html,
      text: config.text,
    });

    return {
      success: true,
      messageId: info.messageId,
      provider: 'smtp'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      provider: 'smtp'
    };
  }
}

/**
 * Send email with multiple fallbacks
 */
export async function sendEmailWithFallbacks(config: EmailConfig): Promise<EmailResult> {
  console.log('📧 Sending email notification...', {
    to: config.to,
    subject: config.subject,
    hasHtml: !!config.html,
    hasText: !!config.text
  });

  // Try Resend first (most reliable)
  if (process.env.RESEND_API_KEY) {
    console.log('📧 Attempting to send via Resend...');
    const resendResult = await sendViaResend(config);
    if (resendResult.success) {
      console.log('✅ Email sent successfully via Resend');
      return resendResult;
    }
    console.log('⚠️ Resend failed:', resendResult.error);
  }

  // Try SMTP
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('📧 Attempting to send via SMTP...');
    const smtpResult = await sendViaSMTP(config);
    if (smtpResult.success) {
      console.log('✅ Email sent successfully via SMTP');
      return smtpResult;
    }
    console.log('⚠️ SMTP failed:', smtpResult.error);
  }

  // Fallback: console logging
  console.log('❌ All email services failed, logging to console:');
  console.log('=== EMAIL NOTIFICATION ===');
  console.log('To:', config.to.join(', '));
  console.log('Subject:', config.subject);
  console.log('HTML:', config.html);
  console.log('Text:', config.text);
  console.log('========================');

  return {
    success: false,
    error: 'All email services failed',
    provider: 'console-fallback'
  };
}

/**
 * Send admin notification email
 */
export async function sendAdminNotification(subject: string, html: string, text?: string): Promise<EmailResult> {
  const config: EmailConfig = {
    subject,
    html,
    text,
    to: getAdminEmails(),
    from: getFromEmail()
  };

  return sendEmailWithFallbacks(config);
}

/**
 * Send email to specific recipients
 */
export async function sendEmailToRecipients(
  to: string[], 
  subject: string, 
  html: string, 
  text?: string
): Promise<EmailResult> {
  const config: EmailConfig = {
    subject,
    html,
    text,
    to,
    from: getFromEmail()
  };

  return sendEmailWithFallbacks(config);
}
