import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to check email configuration
 * This helps debug why email providers aren't being detected
 */
export async function GET() {
  // Check all possible email-related environment variables
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    smtp: {
      SMTP_HOST: process.env.SMTP_HOST ? '✅ Set' : '❌ NOT SET',
      SMTP_PORT: process.env.SMTP_PORT ? `✅ Set (${process.env.SMTP_PORT})` : '❌ NOT SET',
      SMTP_USER: process.env.SMTP_USER ? '✅ Set' : '❌ NOT SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '✅ Set' : '❌ NOT SET',
      SMTP_PASS: process.env.SMTP_PASS ? '✅ Set' : '❌ NOT SET',
      SMTP_SECURE: process.env.SMTP_SECURE ? `✅ Set (${process.env.SMTP_SECURE})` : '❌ NOT SET',
      SMTP_FROM: process.env.SMTP_FROM ? `✅ Set (${process.env.SMTP_FROM})` : '❌ NOT SET',
    },
    resend: {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '✅ Set' : '❌ NOT SET',
    },
    gmail: {
      GMAIL_USER: process.env.GMAIL_USER ? '✅ Set' : '❌ NOT SET',
      GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? '✅ Set' : '❌ NOT SET',
    },
    analysis: {
      hasCustomSMTP: !!(process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)),
      hasResend: !!process.env.RESEND_API_KEY,
      hasGmailSMTP: !!(process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD),
      hasAnyProvider: !!(
        (process.env.SMTP_HOST && process.env.SMTP_USER && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS)) ||
        process.env.RESEND_API_KEY ||
        ((process.env.GMAIL_USER || process.env.SMTP_USER) && (process.env.SMTP_PASSWORD || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD))
      ),
    },
    // Show first few characters of sensitive values (for debugging)
    partialValues: {
      SMTP_HOST: process.env.SMTP_HOST || null,
      SMTP_USER: process.env.SMTP_USER || null,
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? `${process.env.SMTP_PASSWORD.substring(0, 3)}...` : null,
      SMTP_PASS: process.env.SMTP_PASS ? `${process.env.SMTP_PASS.substring(0, 3)}...` : null,
      RESEND_API_KEY: process.env.RESEND_API_KEY ? `${process.env.RESEND_API_KEY.substring(0, 7)}...` : null,
      GMAIL_USER: process.env.GMAIL_USER || null,
    },
  };

  return NextResponse.json(envCheck, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

