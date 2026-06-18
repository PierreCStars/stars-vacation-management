import { NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/email-notifications';
import { renderSlgEmail, detailsTable, slgTextFooter } from '@/lib/email/slg-theme';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';

export async function POST() {
  try {
    console.log('📧 Sending notifications for pending vacation requests...');

    // Get pending requests using the working analytics API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://starsvacationmanagementv2.vercel.app'}/api/analytics/vacations?status=pending`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pending requests: ${response.status}`);
    }

    const data = await response.json();
    const pendingRequests = data.employees || [];

    console.log(`📋 Found ${pendingRequests.length} pending vacation requests`);

    if (pendingRequests.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending requests found',
        processedCount: 0,
        successCount: 0,
        errorCount: 0
      });
    }

    // For each pending request, send a notification
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const request of pendingRequests) {
      try {
        console.log(`📧 Sending admin notification for request...`);
        
        // Email charte SLG via le shell partagé
        const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://starsvacationmanagementv2.vercel.app'}/admin/vacation-requests`;
        const subject = `Demande de congés en attente — ${request.userName || 'Employé inconnu'}`;
        const html = renderSlgEmail({
          title: subject,
          eyebrow: 'Rappel',
          heading: 'Une demande attend votre validation',
          accent: 'gold',
          bodyHtml:
            `<tr><td style="padding:0 0 16px;">Une demande de congés est en attente de validation.</td></tr>` +
            `<tr><td>${detailsTable([
              { label: 'Employé', value: request.userName || 'Inconnu' },
              { label: 'Email', value: request.userEmail || '—' },
              { label: 'Société', value: request.company || 'Inconnu' },
              { label: 'Total jours', value: `${request.totalDays ?? '—'}` },
              { label: 'Demandes', value: `${request.count ?? '—'}` },
            ])}</td></tr>`,
          cta: { label: 'Examiner les demandes', url: adminUrl },
        });
        const text = `Demande de congés en attente — ${request.userName || 'Inconnu'}

Employé : ${request.userName || 'Inconnu'}
Email : ${request.userEmail || '—'}
Société : ${request.company || 'Inconnu'}
Total jours : ${request.totalDays ?? '—'}
Demandes : ${request.count ?? '—'}

Examiner : ${adminUrl}${slgTextFooter()}`;
        
        // Send admin notification
        const result = await sendAdminNotification(subject, html, text);

        if (result.success) {
          console.log(`✅ Admin notification sent successfully`, {
            provider: result.provider,
            messageId: result.messageId
          });
          successCount++;
        } else {
          console.error(`❌ Failed to send admin notification:`, result.error);
          errorCount++;
          errors.push(`Notification failed: ${result.error}`);
        }

      } catch (error) {
        console.error(`❌ Error processing notification:`, error);
        errorCount++;
        errors.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingRequests.length} pending requests`,
      processedCount: pendingRequests.length,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error in send pending notifications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send pending notifications',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
