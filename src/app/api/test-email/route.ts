import { NextResponse } from 'next/server';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET() {
  try {
    console.log('🧪 Testing email service...');
    
    const testEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Test Email</title>
</head>
<body>
    <h1>Test Email from Stars Vacation Management</h1>
    <p>This is a test email to verify the email service is working.</p>
    <p>Time: ${new Date().toISOString()}</p>
    <p>If you receive this email, the email service is configured correctly.</p>
</body>
</html>
    `.trim();

    const result = await sendEmailWithFallbacks(
      ['compta@stars.mc'], 
      '🧪 Test Email - compta@stars.mc - Stars Vacation Management', 
      testEmailBody
    );

    console.log('📧 Email test result:', result);

    return NextResponse.json({
      success: true,
      message: 'Email test completed',
      result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 