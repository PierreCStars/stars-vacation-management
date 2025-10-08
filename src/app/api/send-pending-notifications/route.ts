import { NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/email-notifications';
import { generateAdminNotificationEmail } from '@/lib/email-templates';

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
        
        // Create a simple notification email
        const subject = `Pending Vacation Request - ${request.userName || 'Unknown Employee'}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2563eb;">Pending Vacation Request</h2>
            <p>A vacation request is pending for review:</p>
            <ul>
              <li><strong>Employee:</strong> ${request.userName || 'Unknown'}</li>
              <li><strong>Email:</strong> ${request.userEmail || 'N/A'}</li>
              <li><strong>Company:</strong> ${request.company || 'Unknown'}</li>
              <li><strong>Total Days:</strong> ${request.totalDays || 'N/A'}</li>
              <li><strong>Request Count:</strong> ${request.count || 'N/A'}</li>
            </ul>
            <p>Please review this request in the admin panel.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://starsvacationmanagementv2.vercel.app'}/admin/vacation-requests" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Requests</a></p>
          </div>
        `;
        const text = `
Pending Vacation Request

A vacation request is pending for review:

Employee: ${request.userName || 'Unknown'}
Email: ${request.userEmail || 'N/A'}
Company: ${request.company || 'Unknown'}
Total Days: ${request.totalDays || 'N/A'}
Request Count: ${request.count || 'N/A'}

Please review this request in the admin panel.
        `;
        
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
