/**
 * Test endpoint for email notifications
 * GET /api/test/email-notifications - Test email configuration and send test emails
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification, sendEmailToRecipients, getAdminEmails, getFromEmail } from '@/lib/email-notifications';
import { generateAdminNotificationEmail, generateRequestConfirmationEmail } from '@/lib/email-templates';
import { adminVacationRequestUrl } from '@/lib/urls';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'test';
    const testEmail = url.searchParams.get('email') || 'test@example.com';

    console.log('🧪 Testing email notifications...', { action, testEmail });

    // Test environment configuration
    const config = {
      adminEmails: getAdminEmails(),
      fromEmail: getFromEmail(),
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
      appBaseUrl: process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || 'Not configured',
      notifyAdminEmails: process.env.NOTIFY_ADMIN_EMAILS || 'Not configured'
    };

    console.log('📧 Email configuration:', config);

    if (action === 'config') {
      return NextResponse.json({
        success: true,
        message: 'Email configuration retrieved',
        config
      });
    }

    if (action === 'test-admin') {
      // Test admin notification
      const testData = {
        id: 'test-123',
        userName: 'Test User',
        userEmail: testEmail,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test vacation request for email notification testing',
        company: 'Test Company',
        type: 'Vacation',
        isHalfDay: false,
        halfDayType: null,
        durationDays: 7,
        createdAt: new Date().toISOString(),
        locale: 'en'
      };

      const adminEmail = generateAdminNotificationEmail(testData);
      const result = await sendAdminNotification(adminEmail.subject, adminEmail.html, adminEmail.text);

      return NextResponse.json({
        success: true,
        message: 'Test admin notification sent',
        result,
        testData,
        adminUrl: adminVacationRequestUrl(testData.id, testData.locale)
      });
    }

    if (action === 'test-confirmation') {
      // Test confirmation email
      const testData = {
        id: 'test-456',
        userName: 'Test User',
        userEmail: testEmail,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test vacation request confirmation',
        company: 'Test Company',
        type: 'Vacation',
        isHalfDay: true,
        halfDayType: 'morning' as const,
        durationDays: 0.5,
        createdAt: new Date().toISOString(),
        locale: 'en'
      };

      const confirmationEmail = generateRequestConfirmationEmail(testData);
      const result = await sendEmailToRecipients(
        [testEmail],
        confirmationEmail.subject,
        confirmationEmail.html,
        confirmationEmail.text
      );

      return NextResponse.json({
        success: true,
        message: 'Test confirmation email sent',
        result,
        testData
      });
    }

    if (action === 'test-simple') {
      // Test simple email
      const result = await sendEmailToRecipients(
        [testEmail],
        'Test Email Notification',
        '<h1>Test Email</h1><p>This is a test email from the vacation management system.</p>',
        'Test Email\n\nThis is a test email from the vacation management system.'
      );

      return NextResponse.json({
        success: true,
        message: 'Test simple email sent',
        result
      });
    }

    // Default: return configuration and available actions
    return NextResponse.json({
      success: true,
      message: 'Email notification test endpoint',
      config,
      availableActions: [
        'config - Get email configuration',
        'test-admin - Send test admin notification',
        'test-confirmation - Send test confirmation email',
        'test-simple - Send simple test email'
      ],
      usage: {
        config: '/api/test/email-notifications?action=config',
        testAdmin: '/api/test/email-notifications?action=test-admin&email=your@email.com',
        testConfirmation: '/api/test/email-notifications?action=test-confirmation&email=your@email.com',
        testSimple: '/api/test/email-notifications?action=test-simple&email=your@email.com'
      }
    });

  } catch (error) {
    console.error('❌ Email notification test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      message: 'Email notification test failed'
    }, { status: 500 });
  }
}

