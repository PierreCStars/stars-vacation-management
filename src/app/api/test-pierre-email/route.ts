import { NextResponse } from 'next/server';
import { generateAdminNotificationEmail } from '@/lib/email-templates';
import nodemailer from 'nodemailer';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const testEmail = url.searchParams.get('email') || 'pierre@stars.mc';
    
    console.log('🧪 Testing admin notification email to pierre@stars.mc only...');
    console.log('📧 Target email:', testEmail);
    
    // Test email templates
    const testData = {
      id: 'test-pierre-' + Date.now(),
      userName: 'Test User',
      userEmail: 'test@example.com',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      reason: 'Test vacation request for pierre@stars.mc email testing',
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
    console.log('📄 HTML length:', html.length, 'characters');
    console.log('📄 Text length:', text.length, 'characters');
    
    // Try to send email using SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: `"Stars Vacation Test" <${process.env.SMTP_USER}>`,
        to: testEmail, // Only send to pierre@stars.mc
        subject: `[TEST] ${subject}`,
        html,
        text: text || html.replace(/<[^>]+>/g, " "),
      });

      console.log('✅ Email sent successfully to pierre@stars.mc!');
      console.log('📧 Message ID:', info.messageId);
      
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully to pierre@stars.mc',
        targetEmail: testEmail,
        messageId: info.messageId,
        subject: `[TEST] ${subject}`,
        htmlLength: html.length,
        textLength: text.length
      });
      
    } catch (emailError) {
      console.log('⚠️ Email sending failed:', emailError instanceof Error ? emailError.message : String(emailError));
      return NextResponse.json({
        success: false,
        message: 'Email templates work, but SMTP sending failed',
        targetEmail: testEmail,
        subject: `[TEST] ${subject}`,
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
