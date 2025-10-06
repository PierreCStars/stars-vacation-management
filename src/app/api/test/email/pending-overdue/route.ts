import { NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/mailer';
import { adminVacationRequestUrl } from '@/lib/urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('[TEST_EMAIL] Sending test pending overdue email...');
    
    // Generate test data
    const testRequestId = 'TEST-REQUEST-ID';
    const link = adminVacationRequestUrl(testRequestId, 'en');
    const subject = 'Vacation request pending for review (TEST)';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .request-info { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f59e0b; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #92400e; }
    .info-value { color: #b45309; }
    .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #d97706; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ ${subject}</h1>
    </div>
    
    <div class="content">
      <p>This is a test email to verify the pending overdue notification system.</p>
      
      <div class="request-info">
        <div class="info-row">
          <span class="info-label">Request ID:</span>
          <span class="info-value">#${testRequestId}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee:</span>
          <span class="info-value">Test User (test@example.com)</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company:</span>
          <span class="info-value">Test Company</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">Full day</span>
        </div>
        <div class="info-row">
          <span class="info-label">Start Date:</span>
          <span class="info-value">Monday, January 15, 2025</span>
        </div>
        <div class="info-row">
          <span class="info-label">End Date:</span>
          <span class="info-value">Friday, January 19, 2025</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">5 days</span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason:</span>
          <span class="info-value">Test vacation request for system validation</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted:</span>
          <span class="info-value">${new Date().toLocaleString('en-US')}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${link}" class="cta-button">Review Request</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This is a test email. The link should point to: <code>${link}</code>
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System - Test Email</p>
      <p>If you cannot click the button above, copy and paste this link: <a href="${link}">${link}</a></p>
    </div>
  </div>
</body>
</html>`;

    const text = `
${subject}

This is a test email to verify the pending overdue notification system.

Request Details:
- Request ID: #${testRequestId}
- Employee: Test User (test@example.com)
- Company: Test Company
- Type: Full day
- Start Date: Monday, January 15, 2025
- End Date: Friday, January 19, 2025
- Duration: 5 days
- Reason: Test vacation request for system validation
- Submitted: ${new Date().toLocaleString('en-US')}

Review this request: ${link}

This is a test email. The link should point to: ${link}

---
Stars Vacation Management System - Test Email
`;

    // Send test email only to pierre@stars.mc
    await sendAdminNotification({
      subject,
      html,
      text,
      overrideTo: 'pierre@stars.mc'
    });

    console.log('[TEST_EMAIL] Test email sent successfully to pierre@stars.mc');
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      link,
      recipient: 'pierre@stars.mc'
    });
    
  } catch (error) {
    console.error('[TEST_EMAIL] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Test email failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
