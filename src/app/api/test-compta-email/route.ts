import { NextResponse } from 'next/server';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET() {
  try {
    console.log('🧪 Testing email service for compta@stars.mc...');
    
    const testEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email for compta@stars.mc</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .test-info { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Test Email</h1>
            <p>Stars Vacation Management System</p>
        </div>
        
        <div class="content">
            <h2>Hello compta@stars.mc,</h2>
            
            <p>This is a test email to verify that the email notification system is working correctly for your account.</p>
            
            <div class="test-info">
                <h3>📋 Test Details:</h3>
                <p><strong>Recipient:</strong> compta@stars.mc</p>
                <p><strong>Test Time:</strong> ${new Date().toISOString()}</p>
                <p><strong>Purpose:</strong> Verify email notifications for vacation requests</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">TESTING</span></p>
            </div>
            
            <p><strong>If you receive this email:</strong></p>
            <ul>
                <li>✅ The email service is configured correctly</li>
                <li>✅ You will receive notifications for new vacation requests</li>
                <li>✅ You will receive notifications when requests are approved/rejected</li>
                <li>✅ You will receive monthly CSV reports</li>
            </ul>
            
            <p><em>This is a test email from the Stars Vacation Management System.</em></p>
        </div>
        
        <div class="footer">
            <p>© 2025 Stars Vacation Management System</p>
            <p>Test email sent at: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const result = await sendEmailWithFallbacks(
      ['compta@stars.mc'], 
      '🧪 Test Email - compta@stars.mc - Stars Vacation Management', 
      testEmailBody
    );

    console.log('📧 Email test result for compta@stars.mc:', result);

    return NextResponse.json({
      success: true,
      message: 'Test email sent to compta@stars.mc',
      recipient: 'compta@stars.mc',
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email test failed for compta@stars.mc:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      recipient: 'compta@stars.mc',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 