/**
 * 5-day pending vacation request reminder
 * Sends a reminder to admins every 5 days for pending vacation requests
 * that haven't been reminded in the last 5 days
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/mailer';
import { adminVacationRequestUrl } from '@/lib/urls';
import { renderSlgEmail, slgTextFooter } from '@/lib/email/slg-theme';
import { FieldValue } from 'firebase-admin/firestore';
import { isAdmin } from '@/config/admins';

// 5 days in milliseconds
const FIVE_DAYS_MS = 1000 * 60 * 60 * 24 * 5;

export interface PendingRequestForReminder {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  type?: string;
  company: string;
  reason?: string;
  durationDays?: number;
  createdAt: Date;
  submittedDate: string;
}

export interface ReminderResult {
  success: boolean;
  totalPending: number;
  included: number;
  excluded: number;
  notified: number;
  errors: number;
  errorDetails?: string[];
  timestamp: string;
}

/**
 * Find pending vacation requests that need a reminder
 * Includes only requests that:
 * - Have status = 'pending' (or 'PENDING')
 * - Have NOT been reminded in the last 5 days (lastRemindedAt is null or > 5 days ago)
 */
export async function findPendingRequestsForReminder(): Promise<PendingRequestForReminder[]> {
  console.info('[REMINDER_5D] Finding pending requests for reminder...');
  
  const { db, error } = getFirebaseAdmin();
  if (!db || error) {
    throw new Error(`Firebase Admin not available: ${error}`);
  }

  const fiveDaysAgo = new Date(Date.now() - FIVE_DAYS_MS);

  try {
    // Get all pending requests
    const snapshot = await db
      .collection('vacationRequests')
      .where('status', 'in', ['pending', 'PENDING', 'Pending'])
      .get();

    const requests: PendingRequestForReminder[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Check if this request should be included
      const lastRemindedAt = data.lastRemindedAt;
      let shouldInclude = true;

      if (lastRemindedAt) {
        // Convert Firestore timestamp to Date if needed
        const remindedDate = lastRemindedAt.toDate ? lastRemindedAt.toDate() : new Date(lastRemindedAt);
        // Only include if last reminder was more than 5 days ago
        shouldInclude = remindedDate <= fiveDaysAgo;
      }

      if (shouldInclude) {
        const createdAt = data.createdAt;
        const requestDate = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt || Date.now());

        requests.push({
          id: doc.id,
          userName: data.userName || 'Unknown',
          userEmail: data.userEmail || '',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          type: data.type || 'Full day',
          company: data.company || 'Unknown',
          reason: data.reason,
          durationDays: data.durationDays || 1,
          createdAt: requestDate,
          submittedDate: requestDate.toISOString().split('T')[0]
        });
      }
    }

    console.info(`[REMINDER_5D] Found ${requests.length} pending requests needing reminder`);
    return requests;

  } catch (error) {
    console.error('[REMINDER_5D] Error finding pending requests:', error);
    throw error;
  }
}

/**
 * Generate email content for 5-day pending reminder
 */
export function generateReminderEmail(requests: PendingRequestForReminder[]): { subject: string; html: string; text: string } {
  const count = requests.length;
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://vacation.stars.mc';
  const adminUrl = `${baseUrl}/admin/vacation-requests`;

  const subject = `Demandes de congés en attente — rappel (${count} demande${count !== 1 ? 's' : ''})`;

  const cellBase = 'padding:8px 8px;border-bottom:1px solid rgba(10,10,10,0.06);font-size:12px;font-weight:400;color:#0A0A0A;';
  const th = 'padding:8px 8px;text-align:left;font-size:10px;font-weight:400;letter-spacing:0.08em;text-transform:uppercase;color:#273341;border-bottom:1px solid #D8B11B;';

  const tableRows = requests.map(req => {
    const reviewUrl = adminVacationRequestUrl(req.id, 'fr');
    return `
      <tr>
        <td style="${cellBase}">${req.userName}</td>
        <td style="${cellBase}">${req.startDate} → ${req.endDate}</td>
        <td style="${cellBase}">${req.type || 'Journée complète'}</td>
        <td style="${cellBase}text-align:center;">${req.durationDays || 1}</td>
        <td style="${cellBase}">${req.submittedDate}</td>
        <td style="${cellBase}text-align:center;"><a href="${reviewUrl}" style="color:#0A0A0A;">Examiner</a></td>
      </tr>`;
  }).join('');

  // Corps inséré dans le shell SLG partagé (renderSlgEmail)
  const bodyHtml =
    `<tr><td style="padding:0 0 16px;">${count} demande${count !== 1 ? 's' : ''} de congés en attente de votre validation.</td></tr>` +
    `<tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        <thead><tr>
          <th style="${th}">Employé</th><th style="${th}">Dates</th><th style="${th}">Type</th>
          <th style="${th}text-align:center;">Jours</th><th style="${th}">Soumise le</th><th style="${th}text-align:center;">Action</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
    </td></tr>`;

  const html = renderSlgEmail({
    title: subject,
    eyebrow: 'Rappel · 5 jours',
    heading: 'Demandes de congés en attente',
    accent: 'gold',
    bodyHtml,
    cta: { label: 'Examiner les demandes', url: adminUrl },
    preheader: `${count} demande${count !== 1 ? 's' : ''} à valider`,
  });

  const text = `
DEMANDES DE CONGÉS EN ATTENTE — RAPPEL

${count} demande${count !== 1 ? 's' : ''} en attente de votre validation.

${requests.map((req, idx) => `
${idx + 1}. ${req.userName}
   Dates : ${req.startDate} → ${req.endDate}
   Type : ${req.type || 'Journée complète'}
   Jours : ${req.durationDays || 1}
   Soumise le : ${req.submittedDate}
   Examiner : ${adminVacationRequestUrl(req.id, 'fr')}
`).join('\n')}

Examiner toutes les demandes : ${adminUrl}

Rappel automatique envoyé tous les 5 jours pour les demandes de congés en attente.${slgTextFooter()}`;

  return { subject, html, text };
}

/**
 * Send reminder email to all admins
 */
async function sendReminderToAdmins(requests: PendingRequestForReminder[]): Promise<{ notified: number; errors: number; errorDetails: string[] }> {
  if (requests.length === 0) {
    console.info('[REMINDER_5D] No requests to remind, skipping email');
    return { notified: 0, errors: 0, errorDetails: [] };
  }

  console.info(`[REMINDER_5D] Sending reminder email for ${requests.length} requests...`);

  const { subject, html, text } = generateReminderEmail(requests);

  try {
    await sendAdminNotification({ subject, html, text });
    console.info('[REMINDER_5D] Reminder email sent successfully');
    return { notified: 1, errors: 0, errorDetails: [] };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[REMINDER_5D] Failed to send reminder email:', errorMsg);
    return { notified: 0, errors: 1, errorDetails: [errorMsg] };
  }
}

/**
 * Update lastRemindedAt timestamp for included requests
 */
async function updateReminderTimestamps(requests: PendingRequestForReminder[]): Promise<void> {
  if (requests.length === 0) {
    return;
  }

  const { db, error } = getFirebaseAdmin();
  if (!db || error) {
    console.error('[REMINDER_5D] Cannot update timestamps: Firebase Admin not available');
    return;
  }

  console.info(`[REMINDER_5D] Updating lastRemindedAt for ${requests.length} requests...`);

  const batchSize = 500; // Firestore batch limit

  // Process in batches
  for (let i = 0; i < requests.length; i += batchSize) {
    const batchRequests = requests.slice(i, i + batchSize);
    const batch = db.batch();
    
    for (const req of batchRequests) {
      const docRef = db.collection('vacationRequests').doc(req.id);
      batch.update(docRef, {
        lastRemindedAt: FieldValue.serverTimestamp()
      });
    }

    await batch.commit();
    console.info(`[REMINDER_5D] Updated batch ${Math.floor(i / batchSize) + 1} (${batchRequests.length} requests)`);
  }

  console.info('[REMINDER_5D] All reminder timestamps updated');
}

/**
 * Run the complete 5-day reminder process
 */
export async function runPendingReminder5d(): Promise<ReminderResult> {
  console.info('[REMINDER_5D] Starting 5-day pending reminder process...');

  try {
    // Check if reminders are enabled
    const remindersEnabled = process.env.REMINDER_ENABLED !== 'false';
    if (!remindersEnabled) {
      console.info('[REMINDER_5D] Reminders are disabled (REMINDER_ENABLED=false)');
      return {
        success: true,
        totalPending: 0,
        included: 0,
        excluded: 0,
        notified: 0,
        errors: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Find pending requests that need reminder
    const requests = await findPendingRequestsForReminder();

    if (requests.length === 0) {
      console.info('[REMINDER_5D] No pending requests need reminder');
      return {
        success: true,
        totalPending: 0,
        included: 0,
        excluded: 0,
        notified: 0,
        errors: 0,
        timestamp: new Date().toISOString()
      };
    }

    // Get total pending count for reporting
    const { db } = getFirebaseAdmin();
    let totalPending = requests.length;
    if (db) {
      const allPendingSnapshot = await db
        .collection('vacationRequests')
        .where('status', 'in', ['pending', 'PENDING', 'Pending'])
        .get();
      totalPending = allPendingSnapshot.size;
    }

    // Send reminder email
    const { notified, errors, errorDetails } = await sendReminderToAdmins(requests);

    // Update reminder timestamps only if email was sent successfully
    if (notified > 0 && errors === 0) {
      await updateReminderTimestamps(requests);
    }

    const result: ReminderResult = {
      success: errors === 0,
      totalPending,
      included: requests.length,
      excluded: totalPending - requests.length,
      notified,
      errors,
      errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
      timestamp: new Date().toISOString()
    };

    console.info('[REMINDER_5D] Reminder process completed', result);
    return result;

  } catch (error) {
    console.error('[REMINDER_5D] Fatal error in reminder process:', error);
    return {
      success: false,
      totalPending: 0,
      included: 0,
      excluded: 0,
      notified: 0,
      errors: 1,
      errorDetails: [error instanceof Error ? error.message : String(error)],
      timestamp: new Date().toISOString()
    };
  }
}

