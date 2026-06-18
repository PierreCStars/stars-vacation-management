/**
 * Core logic for automated admin notifications for pending vacation requests
 * Handles 3-day and 7-day threshold notifications with deduplication
 */

import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { sendAdminNotification } from '@/lib/mailer';
import { adminVacationRequestUrl } from '@/lib/urls';
import { renderSlgEmail, detailsTable, slgTextFooter } from '@/lib/email/slg-theme';
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
      
      // Sujet + contenu (charte SLG, FR, via le shell email partagé)
      const joursLabel = threshold === '3d' ? '3 jours' : '7 jours';
      const subject = `Demande de congés en attente de validation (${joursLabel})`;

      const fmt = (d?: string) => d
        ? new Date(d).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Non précisé';
      const formattedStartDate = fmt(request.startDate);
      const formattedEndDate = fmt(request.endDate);
      const dureeLabel = `${request.durationDays} jour${request.durationDays !== 1 ? 's' : ''}${request.isHalfDay ? ` · demi-journée (${request.halfDayType})` : ''}`;

      const bodyHtml =
        `<tr><td style="padding:0 0 16px;">Une demande de congés est en attente depuis ${joursLabel} et requiert votre validation.</td></tr>` +
        `<tr><td>${detailsTable([
          { label: 'Employé', value: `${request.requesterName} <span style="color:rgba(39,51,65,0.7)">${request.requesterEmail}</span>` },
          { label: 'Société', value: request.company || '—' },
          { label: 'Type', value: request.type || '—' },
          { label: 'Début', value: formattedStartDate },
          { label: 'Fin', value: formattedEndDate },
          { label: 'Durée', value: dureeLabel },
          { label: 'Motif', value: request.reason || '—' },
          { label: 'Soumise le', value: request.createdAt.toLocaleString('fr-FR') },
        ])}</td></tr>`;

      const html = renderSlgEmail({
        title: subject,
        eyebrow: `Rappel · ${joursLabel}`,
        heading: 'Une demande attend votre validation',
        accent: 'gold',
        bodyHtml,
        cta: { label: 'Examiner la demande', url: adminUrl },
        preheader: `${request.requesterName} · ${formattedStartDate} → ${formattedEndDate}`,
      });

      const text = `Demande de congés en attente (${joursLabel})

Employé : ${request.requesterName} (${request.requesterEmail})
Société : ${request.company}
Type : ${request.type}
Début : ${formattedStartDate}
Fin : ${formattedEndDate}
Durée : ${dureeLabel}
Motif : ${request.reason || '—'}
Soumise le : ${request.createdAt.toLocaleString('fr-FR')}

Examiner cette demande : ${adminUrl}${slgTextFooter()}`;

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
