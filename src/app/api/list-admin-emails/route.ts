import { NextResponse } from 'next/server';
import { getAdminEmails } from '@/lib/email-notifications';
import { adminRecipients } from '@/lib/mailer';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('📋 Listing admin email configurations...');
    
    // Get admin emails from different sources
    const notifyAdminEmails = process.env.NOTIFY_ADMIN_EMAILS;
    const adminEmails = process.env.ADMIN_EMAILS;
    const emailNotificationsEmails = getAdminEmails();
    const mailerEmails = adminRecipients();
    
    console.log('🔍 Environment variables:');
    console.log('  NOTIFY_ADMIN_EMAILS:', notifyAdminEmails || 'Not set');
    console.log('  ADMIN_EMAILS:', adminEmails || 'Not set');
    console.log('📧 Email notifications recipients:', emailNotificationsEmails);
    console.log('📧 Mailer recipients:', mailerEmails);
    
    return NextResponse.json({
      success: true,
      environment: {
        NOTIFY_ADMIN_EMAILS: notifyAdminEmails || 'Not set',
        ADMIN_EMAILS: adminEmails || 'Not set'
      },
      emailNotifications: {
        function: 'getAdminEmails()',
        recipients: emailNotificationsEmails,
        count: emailNotificationsEmails.length
      },
      mailer: {
        function: 'adminRecipients()',
        recipients: mailerEmails,
        count: mailerEmails.length
      },
      summary: {
        totalUniqueEmails: [...new Set([...emailNotificationsEmails, ...mailerEmails])].length,
        allEmails: [...new Set([...emailNotificationsEmails, ...mailerEmails])]
      }
    });

  } catch (error) {
    console.error('❌ Failed to list admin emails:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
