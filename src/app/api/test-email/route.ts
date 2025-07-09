import { NextResponse } from 'next/server';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET() {
  try {
    console.log('🧪 Testing email functionality...');
    
    const result = await sendEmailWithFallbacks(
      ['pierre@stars.mc'],
      'Test Email from Vacation Management App',
      `
        <h2>Test Email from Vacation Management</h2>
        <p>This is a test email sent from the vacation management application.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>If you receive this, the email system is working!</p>
        <hr>
        <p><strong>Environment Check:</strong></p>
        <ul>
          <li>GMAIL_USER: ${process.env.GMAIL_USER ? 'Set' : 'NOT SET'}</li>
          <li>SMTP_PASSWORD: ${process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET'}</li>
          <li>RESEND_API_KEY: ${process.env.RESEND_API_KEY ? 'Set' : 'NOT SET'}</li>
          <li>NODE_ENV: ${process.env.NODE_ENV}</li>
        </ul>
        <p><strong>Email Service Status:</strong></p>
        <ul>
          <li>Gmail SMTP: ${process.env.GMAIL_USER && process.env.SMTP_PASSWORD ? 'Configured' : 'Not Configured'}</li>
          <li>Resend: ${process.env.RESEND_API_KEY ? 'Configured' : 'Not Configured'}</li>
          <li>Ethereal: Always available as fallback</li>
        </ul>
      `
    );
    
    console.log('📧 Email test result:', result);
    
    return NextResponse.json({
      success: true,
      emailResult: result,
      message: 'Email test completed. Check the logs and your inbox.',
      environment: {
        GMAIL_USER: process.env.GMAIL_USER ? 'Set' : 'NOT SET',
        SMTP_PASSWORD: process.env.SMTP_PASSWORD ? 'Set' : 'NOT SET',
        RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV
      },
      instructions: {
        ifEtherealUsed: 'Email sent via Ethereal (test service). Check the preview URL in the logs.',
        ifGmailFailed: 'Gmail SMTP failed. Update your app password in Vercel environment variables.',
        ifResendFailed: 'Resend failed. Domain verification required or API key missing.'
      }
    });
  } catch (error) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Email test failed. Check the logs for details.'
    }, { status: 500 });
  }
} 