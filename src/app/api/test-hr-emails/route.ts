import { NextResponse } from 'next/server';
import { sendEmailToRecipients, getFromEmail } from '@/lib/email-notifications';
import { generateRequestConfirmationEmail, generateDecisionEmail } from '@/lib/email-templates';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'test-all';
    const testEmail = url.searchParams.get('email') || 'pierre@stars.mc';

    console.log('🧪 Testing HR email system...', { action, testEmail });

    const testData = {
      id: 'test-hr-123',
      userName: 'Test User',
      userEmail: testEmail,
      startDate: '2025-09-15',
      endDate: '2025-09-20',
      reason: 'Test vacation request for HR email system',
      company: 'Stars MC',
      type: 'Full day',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 5,
      createdAt: new Date().toISOString(),
      locale: 'en'
    };

    const results: any = {
      fromEmail: getFromEmail(),
      timestamp: new Date().toISOString(),
      tests: {}
    };

    if (action === 'test-all' || action === 'test-confirmation') {
      console.log('📧 Testing confirmation email...');
      const confirmationEmail = generateRequestConfirmationEmail(testData);
      
      const confirmationResult = await sendEmailToRecipients(
        [testEmail],
        confirmationEmail.subject,
        confirmationEmail.html,
        confirmationEmail.text
      );

      results.tests.confirmation = {
        success: confirmationResult.success,
        provider: confirmationResult.provider,
        messageId: confirmationResult.messageId,
        error: confirmationResult.error,
        subject: confirmationEmail.subject
      };
    }

    if (action === 'test-all' || action === 'test-approved') {
      console.log('📧 Testing approved decision email...');
      const approvedEmail = generateDecisionEmail({
        ...testData,
        decision: 'approved',
        adminComment: 'Test approval comment from HR system',
        reviewedBy: 'HR Department'
      });
      
      const approvedResult = await sendEmailToRecipients(
        [testEmail],
        approvedEmail.subject,
        approvedEmail.html,
        approvedEmail.text
      );

      results.tests.approved = {
        success: approvedResult.success,
        provider: approvedResult.provider,
        messageId: approvedResult.messageId,
        error: approvedResult.error,
        subject: approvedEmail.subject
      };
    }

    if (action === 'test-all' || action === 'test-denied') {
      console.log('📧 Testing denied decision email...');
      const deniedEmail = generateDecisionEmail({
        ...testData,
        decision: 'denied',
        adminComment: 'Test denial comment from HR system',
        reviewedBy: 'HR Department'
      });
      
      const deniedResult = await sendEmailToRecipients(
        [testEmail],
        deniedEmail.subject,
        deniedEmail.html,
        deniedEmail.text
      );

      results.tests.denied = {
        success: deniedResult.success,
        provider: deniedResult.provider,
        messageId: deniedResult.messageId,
        error: deniedResult.error,
        subject: deniedEmail.subject
      };
    }

    const allSuccessful = Object.values(results.tests).every((test: any) => test.success);
    
    return NextResponse.json({
      success: allSuccessful,
      message: allSuccessful 
        ? 'All HR email tests completed successfully' 
        : 'Some HR email tests failed',
      ...results
    });

  } catch (error) {
    console.error('❌ HR email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
