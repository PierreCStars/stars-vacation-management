import { NextResponse } from 'next/server';
import { sendAdminNotification, getAdminEmails, getFromEmail } from '@/lib/email-notifications';
import { generateAdminNotificationEmail } from '@/lib/email-templates';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const testEmail = url.searchParams.get('email') || 'pierre@stars.mc';

    console.log('🧪 Testing admin notification email to all admins...');

    const testData = {
      id: 'test-admin-' + Date.now(),
      userName: 'Test Employee',
      userEmail: testEmail,
      startDate: '2025-09-15',
      endDate: '2025-09-20',
      reason: 'Test vacation request for admin notification system',
      company: 'Stars MC',
      type: 'Full day',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 5,
      createdAt: new Date().toISOString(),
      locale: 'en'
    };

    // Generate admin notification email
    const adminEmail = generateAdminNotificationEmail(testData);
    
    // Send to all admins
    const result = await sendAdminNotification(
      `[TEST] ${adminEmail.subject}`,
      adminEmail.html,
      adminEmail.text
    );

    const adminEmails = getAdminEmails();

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Test admin notification sent successfully to all admins' 
        : 'Failed to send admin notification',
      fromEmail: getFromEmail(),
      adminRecipients: adminEmails,
      recipientCount: adminEmails.length,
      provider: result.provider,
      messageId: result.messageId,
      error: result.error,
      subject: `[TEST] ${adminEmail.subject}`,
      htmlLength: adminEmail.html.length,
      textLength: adminEmail.text.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin notification test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}



