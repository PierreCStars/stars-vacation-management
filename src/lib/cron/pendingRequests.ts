/**
 * Core logic for automated admin notifications for pending vacation requests
 * Handles 3-day and 7-day threshold notifications with deduplication
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/mailer';
import { adminVacationRequestUrl } from '@/lib/urls';
import { FieldValue } from 'firebase-admin/firestore';

// Time constants
export const THREE_DAYS_MS = 1000 * 60 * 60 * 24 * 3;
export const SEVEN_DAYS_MS = 1000 * 60 * 60 * 24 * 7;

// Types
export interface OverdueRequest {
  id: string;
  locale?: string;
  requesterName?: string;
  requesterEmail?: string;
  startDate?: string;
  endDate?: string;
  createdAt: Date;
  company?: string;
  type?: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
}

// Shared interface for pending request data from Firestore
export interface PendingRequestSummary {
  id: string;
  userName?: string;
  userEmail?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: any; // Firestore Timestamp
  company?: string;
  type?: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
  locale?: string;
  status?: string;
}

export interface PendingCheckResult {
  threshold: '3d' | '7d';
  total: number;
  notified: number;
  skipped: number;
  errors: number;
  errorDetails?: string[];
}

/**
 * Find vacation requests that are overdue for notification at the given threshold
 */
export async function findOverduePending(
  db: FirebaseFirestore.Firestore,
  olderThanMs: number,
  threshold: '3d' | '7d'
): Promise<OverdueRequest[]> {
  console.info('[CRON_PENDING] start', { threshold, olderThanMs });
  
  const cutoffDate = new Date(Date.now() - olderThanMs);
  const dedupeField = threshold === '3d' ? 'notifiedAt3d' : 'notifiedAt7d';
  
  try {
    // Query for pending requests older than cutoff that haven't been notified for this threshold
    const snapshot = await db
      .collection('vacationRequests')
      .where('status', '==', 'pending')
      .where('createdAt', '<=', cutoffDate)
      .get();

    console.info('[CRON_PENDING] found', { threshold, total: snapshot.docs.length });

    const overdueRequests: OverdueRequest[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already notified for this threshold
      if (data[dedupeField]) {
        console.info('[CRON_PENDING] skip', { reason: 'alreadyNotified', id: doc.id, threshold });
        continue;
      }

      // Skip if createdAt is missing or invalid
      if (!data.createdAt) {
        console.info('[CRON_PENDING] skip', { reason: 'noCreatedAt', id: doc.id });
        continue;
      }

      // Convert Firestore timestamp to Date if needed
      const createdAt = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
      
      if (isNaN(createdAt.getTime())) {
        console.info('[CRON_PENDING] skip', { reason: 'invalidCreatedAt', id: doc.id });
        continue;
      }

      overdueRequests.push({
        id: doc.id,
        locale: data.locale || 'en',
        requesterName: data.userName || 'Unknown',
        requesterEmail: data.userEmail || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        createdAt,
        company: data.company || 'Unknown',
        type: data.type || 'Full day',
        reason: data.reason || '',
        isHalfDay: data.isHalfDay || false,
        halfDayType: data.halfDayType || null,
        durationDays: data.durationDays || 1,
      });
    }

    console.info('[CRON_PENDING] filtered', { threshold, overdue: overdueRequests.length });
    return overdueRequests;

  } catch (error) {
    console.error('[CRON_PENDING] error', { threshold, error: String(error) });
    throw error;
  }
}

/**
 * Send admin notifications for overdue requests and update deduplication fields
 */
export async function notifyAdminsForOverdue(
  requests: OverdueRequest[],
  threshold: '3d' | '7d'
): Promise<{ notified: number; errors: number; errorDetails: string[] }> {
  console.info('[CRON_PENDING] notifying', { threshold, count: requests.length });
  
  let notified = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  for (const request of requests) {
    try {
      // Build admin URL
      const adminUrl = adminVacationRequestUrl(request.id, request.locale);
      
      // Generate subject and content
      const subject = `Vacation request pending for review (${threshold === '3d' ? '3 days' : '7 days'})`;
      
      const formattedStartDate = request.startDate ? new Date(request.startDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Not specified';
      
      const formattedEndDate = request.endDate ? new Date(request.endDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Not specified';

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .request-info { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #f59e0b; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #92400e; }
    .info-value { color: #b45309; }
    .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #d97706; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    .badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .half-day { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ ${subject}</h1>
    </div>
    
    <div class="content">
      <p>A vacation request has been pending for ${threshold === '3d' ? '3 days' : '7 days'} and requires your review.</p>
      
      <div class="request-info">
        <div class="info-row">
          <span class="info-label">Request ID:</span>
          <span class="info-value">#${request.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee:</span>
          <span class="info-value">${request.requesterName} (${request.requesterEmail})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company:</span>
          <span class="info-value">${request.company}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${request.type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Start Date:</span>
          <span class="info-value">${formattedStartDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">End Date:</span>
          <span class="info-value">${formattedEndDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">
            ${request.durationDays} day${request.durationDays !== 1 ? 's' : ''}
            ${request.isHalfDay ? `<span class="badge half-day">Half Day (${request.halfDayType})</span>` : ''}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason:</span>
          <span class="info-value">${request.reason}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted:</span>
          <span class="info-value">${request.createdAt.toLocaleString('en-US')}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${adminUrl}" class="cta-button">Review Request</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This request has been pending for ${threshold === '3d' ? '3 days' : '7 days'}. Please review and take appropriate action.
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System</p>
      <p>If you cannot click the button above, copy and paste this link: <a href="${adminUrl}">${adminUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

      const text = `
${subject}

A vacation request has been pending for ${threshold === '3d' ? '3 days' : '7 days'} and requires your review.

Request Details:
- Request ID: #${request.id}
- Employee: ${request.requesterName} (${request.requesterEmail})
- Company: ${request.company}
- Type: ${request.type}
- Start Date: ${formattedStartDate}
- End Date: ${formattedEndDate}
- Duration: ${request.durationDays} day${request.durationDays !== 1 ? 's' : ''}${request.isHalfDay ? ` (Half Day - ${request.halfDayType})` : ''}
- Reason: ${request.reason}
- Submitted: ${request.createdAt.toLocaleString('en-US')}

Review this request: ${adminUrl}

This request has been pending for ${threshold === '3d' ? '3 days' : '7 days'}. Please review and take appropriate action.

---
Stars Vacation Management System
`;

      // Send email
      await sendAdminNotification({
        subject,
        html,
        text
      });

      // Update deduplication field
      const { db } = getFirebaseAdmin();
      if (db) {
        const dedupeField = threshold === '3d' ? 'notifiedAt3d' : 'notifiedAt7d';
        await db.collection('vacationRequests').doc(request.id).update({
          [dedupeField]: FieldValue.serverTimestamp()
        });
      }

      console.info('[CRON_PENDING] sent', { threshold, id: request.id });
      notified++;

    } catch (error) {
      const errorMsg = `Failed to notify for request ${request.id}: ${error instanceof Error ? error.message : String(error)}`;
      console.error('[CRON_PENDING] error', { id: request.id, error: errorMsg });
      errorDetails.push(errorMsg);
      errors++;
    }
  }

  return { notified, errors, errorDetails };
}

/**
 * Run the complete pending check process for a given threshold
 */
export async function runPendingCheck(threshold: '3d' | '7d'): Promise<PendingCheckResult> {
  console.info('[CRON_PENDING] start', { threshold });
  
  try {
    // Get Firebase admin instance
    const { db, error } = getFirebaseAdmin();
    if (!db || error) {
      throw new Error(`Firebase Admin not available: ${error}`);
    }

    // Determine time threshold
    const olderThanMs = threshold === '3d' ? THREE_DAYS_MS : SEVEN_DAYS_MS;
    
    // Find overdue requests
    const overdueRequests = await findOverduePending(db, olderThanMs, threshold);
    
    // Send notifications
    const { notified, errors, errorDetails } = await notifyAdminsForOverdue(overdueRequests, threshold);
    
    const result: PendingCheckResult = {
      threshold,
      total: overdueRequests.length,
      notified,
      skipped: overdueRequests.length - notified - errors,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined
    };

    console.info('[CRON_PENDING] complete', result);
    return result;

  } catch (error) {
    console.error('[CRON_PENDING] fatal', { threshold, error: String(error) });
    throw error;
  }
}
