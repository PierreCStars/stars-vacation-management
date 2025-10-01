import { NextResponse } from 'next/server';
import { getFirebaseAdminFirestore, isFirebaseAdminAvailable } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/mailer';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

interface OverdueRequest {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company: string;
  createdAt: any;
  daysOverdue: number;
}

/**
 * Generate email content for overdue vacation request notification
 */
function generateOverdueRequestEmail(request: OverdueRequest, baseUrl: string) {
  const requestUrl = `${baseUrl}/admin/vacation-requests/${request.id}`;
  const daysOverdue = request.daysOverdue;
  
  const subject = `Vacation request pending for review - ${request.userName}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc3545;">⚠️ Vacation Request Awaiting Review</h2>
      
      <p>A vacation request has been pending for <strong>${daysOverdue} days</strong> and requires your attention.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #495057;">Request Details</h3>
        <p><strong>Employee:</strong> ${request.userName} (${request.userEmail})</p>
        <p><strong>Company:</strong> ${request.company}</p>
        <p><strong>Dates:</strong> ${request.startDate} to ${request.endDate}</p>
        ${request.reason ? `<p><strong>Reason:</strong> ${request.reason}</p>` : ''}
        <p><strong>Submitted:</strong> ${new Date(request.createdAt).toLocaleDateString()}</p>
        <p><strong>Days Overdue:</strong> ${daysOverdue}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${requestUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Review Request
        </a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">
        This is an automated notification. Please review the request as soon as possible.
      </p>
    </div>
  `;
  
  const text = `
VACATION REQUEST PENDING FOR REVIEW

A vacation request has been pending for ${daysOverdue} days and requires your attention.

Request Details:
- Employee: ${request.userName} (${request.userEmail})
- Company: ${request.company}
- Dates: ${request.startDate} to ${request.endDate}
${request.reason ? `- Reason: ${request.reason}` : ''}
- Submitted: ${new Date(request.createdAt).toLocaleDateString()}
- Days Overdue: ${daysOverdue}

Review the request here: ${requestUrl}

This is an automated notification. Please review the request as soon as possible.
  `;
  
  return { subject, html, text };
}

/**
 * Find vacation requests that have been pending for 3+ days
 */
async function findOverdueRequests(): Promise<OverdueRequest[]> {
  if (!isFirebaseAdminAvailable()) {
    console.error('[CRON] Firebase Admin not available');
    return [];
  }

  const db = getFirebaseAdminFirestore();
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  console.log('[CRON] Looking for requests older than:', threeDaysAgo.toISOString());
  
  try {
    const snapshot = await db
      .collection('vacationRequests')
      .where('status', '==', 'pending')
      .get();
    
    const overdueRequests: OverdueRequest[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const createdAt = data.createdAt;
      
      if (!createdAt) {
        console.warn('[CRON] Request without createdAt:', doc.id);
        continue;
      }
      
      // Convert Firestore timestamp to Date if needed
      const requestDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
      
      if (requestDate <= threeDaysAgo) {
        const daysOverdue = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
        
        overdueRequests.push({
          id: doc.id,
          userName: data.userName || 'Unknown',
          userEmail: data.userEmail || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          reason: data.reason,
          company: data.company || 'Unknown',
          createdAt: requestDate,
          daysOverdue
        });
      }
    }
    
    console.log(`[CRON] Found ${overdueRequests.length} overdue requests`);
    return overdueRequests;
    
  } catch (error) {
    console.error('[CRON] Error querying overdue requests:', error);
    return [];
  }
}

/**
 * Send notification emails for overdue requests
 */
async function sendOverdueNotifications(requests: OverdueRequest[]): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://stars-vacation-management.vercel.app';
  
  for (const request of requests) {
    try {
      console.log(`[CRON] Sending notification for request ${request.id} (${request.daysOverdue} days overdue)`);
      
      const { subject, html, text } = generateOverdueRequestEmail(request, baseUrl);
      
      await sendAdminNotification({ subject, html, text });
      
      console.log(`[CRON] ✅ Notification sent for request ${request.id}`);
      
    } catch (error) {
      console.error(`[CRON] ❌ Failed to send notification for request ${request.id}:`, error);
    }
  }
}

export async function GET() {
  try {
    console.log('[CRON] Starting check for overdue vacation requests...');
    
    const overdueRequests = await findOverdueRequests();
    
    if (overdueRequests.length === 0) {
      console.log('[CRON] No overdue requests found');
      return NextResponse.json({
        success: true,
        message: 'No overdue requests found',
        overdueCount: 0,
        timestamp: new Date().toISOString()
      });
    }
    
    console.log(`[CRON] Found ${overdueRequests.length} overdue requests, sending notifications...`);
    
    await sendOverdueNotifications(overdueRequests);
    
    console.log('[CRON] ✅ Overdue request check completed');
    
    return NextResponse.json({
      success: true,
      message: `Processed ${overdueRequests.length} overdue requests`,
      overdueCount: overdueRequests.length,
      requests: overdueRequests.map(r => ({
        id: r.id,
        userName: r.userName,
        daysOverdue: r.daysOverdue
      })),
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[CRON] ❌ Error in overdue request check:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST for manual triggering
export async function POST() {
  return GET();
}
