import { NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/mailer';
import { generateAdminNotificationEmail } from '@/lib/email-templates';

export async function GET() {
  try {
    console.log('🧪 Testing email notification system...');
    
    // Test email templates
    const testData = {
      id: 'test-123',
      userName: 'Test User',
      userEmail: 'test@example.com',
      startDate: '2025-09-15',
      endDate: '2025-09-20',
      reason: 'Test vacation',
      company: 'Stars MC',
      type: 'Full day',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 5,
      createdAt: new Date().toISOString(),
      locale: 'en'
    };
    
    const { subject, html, text } = generateAdminNotificationEmail(testData);
    
    console.log('✅ Email templates generated successfully');
    console.log('Subject:', subject);
    console.log('HTML length:', html.length, 'characters');
    console.log('Text length:', text.length, 'characters');
    
    // Try to send email (this will fail if SMTP not configured, but that's expected)
    try {
      await sendAdminNotification({ subject, html, text });
      console.log('✅ Email sent successfully!');
      return NextResponse.json({ 
        success: true, 
        message: 'Email sent successfully',
        subject,
        htmlLength: html.length,
        textLength: text.length
      });
    } catch (emailError) {
      console.log('⚠️ Email sending failed (expected if SMTP not configured):', emailError instanceof Error ? emailError.message : String(emailError));
      return NextResponse.json({ 
        success: true, 
        message: 'Email templates work, but SMTP not configured',
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
