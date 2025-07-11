import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing email service...');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const testSubject = '🧪 Test Email - Vacation Management System';
    const testBody = `
      <html>
        <body>
          <h2>Test Email</h2>
          <p>This is a test email to verify that the email notification system is working correctly.</p>
          <p><strong>Sent by:</strong> ${session.user.email}</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p>If you receive this email, the notification system is working properly.</p>
        </body>
      </html>
    `;

    console.log('📧 Sending test email to all admins...');
    console.log('📧 Recipients:', adminEmails);
    
    const result = await sendEmailWithFallbacks(adminEmails, testSubject, testBody);
    
    console.log('✅ Test email sent successfully');
    console.log('📧 Email result:', result);

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent to all admins',
      recipients: adminEmails,
      result: result
    });

  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return NextResponse.json(
      { error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 