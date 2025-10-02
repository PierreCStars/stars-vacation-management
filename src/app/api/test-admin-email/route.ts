import { NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/mailer';
import { generateAdminNotificationEmail } from '@/lib/email-templates';
import { getBaseUrl, adminVacationRequestUrl } from '@/lib/urls';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const testEmail = url.searchParams.get('email') || 'pierre@stars.mc';
    
    console.log('🧪 Testing admin notification email...');
    console.log('📧 Target email:', testEmail);
    
    // Test URL generation
    const baseUrl = getBaseUrl();
    const testRequestId = 'test-123';
    const adminUrl = adminVacationRequestUrl(testRequestId, 'en');
    
    console.log('🌐 Base URL:', baseUrl);
    console.log('🔗 Admin URL:', adminUrl);
    
    // Test email templates
    const testData = {
      id: testRequestId,
      userName: 'Test User',
      userEmail: 'test@example.com',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      reason: 'Test vacation request for URL validation',
      company: 'Stars MC',
      type: 'Full day',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 3,
      createdAt: new Date().toISOString(),
      locale: 'en'
    };

    const { subject, html, text } = generateAdminNotificationEmail(testData);
    
    console.log('✅ Email templates generated successfully');
    console.log('📧 Subject:', subject);
    console.log('🔗 URL in email:', adminUrl);
    console.log('📄 HTML length:', html.length, 'characters');
    console.log('📄 Text length:', text.length, 'characters');
    
    // Verify the URL is correct (not localhost)
    if (adminUrl.includes('localhost')) {
      console.error('❌ ERROR: URL still contains localhost!');
      return NextResponse.json({
        success: false,
        error: 'URL still contains localhost',
        baseUrl,
        adminUrl,
        subject,
        htmlLength: html.length,
        textLength: text.length
      }, { status: 500 });
    }
    
    // Try to send email (this will fail if SMTP not configured, but that's expected)
    try {
      await sendAdminNotification({ subject, html, text });
      console.log('✅ Email sent successfully!');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        targetEmail: testEmail,
        baseUrl,
        adminUrl,
        subject,
        htmlLength: html.length,
        textLength: text.length
      });
    } catch (emailError) {
      console.log('⚠️ Email sending failed (expected if SMTP not configured):', emailError instanceof Error ? emailError.message : String(emailError));
      return NextResponse.json({
        success: true,
        message: 'Email templates work, but SMTP not configured',
        targetEmail: testEmail,
        baseUrl,
        adminUrl,
        subject,
        htmlLength: html.length,
        textLength: text.length,
        emailError: emailError instanceof Error ? emailError.message : String(emailError)
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
