/**
 * HTML email templates for vacation request notifications.
 * All wrapped in the shared SLG email shell (src/lib/email/slg-theme.ts).
 */

import { adminVacationRequestUrl } from './urls';
import { renderSlgEmail, detailsTable, slgTextFooter, type EmailAccent } from './email/slg-theme';

export interface VacationRequestData {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  company?: string;
  type: string;
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays: number;
  createdAt: string;
  locale?: string;
}

export interface AdminReviewNotificationData {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  company?: string;
  type: string;
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays: number;
  decision: 'approved' | 'denied';
  reviewedBy: string;
  reviewerEmail: string;
  reviewedAt: string;
  adminComment?: string;
  locale?: string;
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
};

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', DATE_OPTS);
}

function durationLabel(data: { durationDays: number; isHalfDay: boolean; halfDayType?: string | null }): string {
  const base = `${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}`;
  return data.isHalfDay ? `${base} · half day (${data.halfDayType ?? ''})` : base;
}

function paragraph(text: string): string {
  return `<tr><td style="padding:0 0 16px;">${text}</td></tr>`;
}

function detailsRow(html: string): string {
  return `<tr><td>${html}</td></tr>`;
}

/**
 * Admin notification — a new request needs review.
 */
export function generateAdminNotificationEmail(data: VacationRequestData): { subject: string; html: string; text: string } {
  const adminUrl = adminVacationRequestUrl(data.id, data.locale || 'en');
  const subject = `New vacation request — ${data.userName} (${data.company || 'Unknown'})`;

  const bodyHtml =
    paragraph(`A new vacation request has been submitted and is awaiting your review.`) +
    detailsRow(detailsTable([
      { label: 'Employee', value: `${data.userName} <span style="color:rgba(39,51,65,0.7)">${data.userEmail}</span>` },
      { label: 'Company', value: data.company || 'Unknown' },
      { label: 'Type', value: data.type },
      { label: 'Start date', value: fmtDate(data.startDate) },
      { label: 'End date', value: fmtDate(data.endDate) },
      { label: 'Duration', value: durationLabel(data) },
      { label: 'Reason', value: data.reason || '—' },
      { label: 'Submitted', value: new Date(data.createdAt).toLocaleString('en-US') },
    ]));

  const html = renderSlgEmail({
    title: subject,
    eyebrow: 'New request',
    heading: 'A request needs your review',
    accent: 'gold',
    bodyHtml,
    cta: { label: 'Review request', url: adminUrl },
    preheader: `${data.userName} · ${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}`,
  });

  const text = `New vacation request

Employee: ${data.userName} (${data.userEmail})
Company: ${data.company || 'Unknown'}
Type: ${data.type}
Start: ${fmtDate(data.startDate)}
End: ${fmtDate(data.endDate)}
Duration: ${durationLabel(data)}
Reason: ${data.reason || '—'}
Submitted: ${new Date(data.createdAt).toLocaleString('en-US')}

Review this request: ${adminUrl}${slgTextFooter()}`;

  return { subject, html, text };
}

/**
 * Confirmation to the requester — request received, pending review.
 */
export function generateRequestConfirmationEmail(data: VacationRequestData): { subject: string; html: string; text: string } {
  const subject = `Your vacation request has been received`;

  const bodyHtml =
    paragraph(`Hi ${data.userName}, your vacation request has been received and is now pending review. You'll get another email once a decision is made.`) +
    detailsRow(detailsTable([
      { label: 'Type', value: data.type },
      { label: 'Start date', value: fmtDate(data.startDate) },
      { label: 'End date', value: fmtDate(data.endDate) },
      { label: 'Duration', value: durationLabel(data) },
      { label: 'Reason', value: data.reason || '—' },
      { label: 'Status', value: 'Pending review' },
    ]));

  const html = renderSlgEmail({
    title: subject,
    eyebrow: 'Request received',
    heading: 'We’ve got your request',
    accent: 'gold',
    bodyHtml,
    preheader: `Pending review · ${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}`,
  });

  const text = `Hi ${data.userName},

Your vacation request has been received and is pending review.

Type: ${data.type}
Start: ${fmtDate(data.startDate)}
End: ${fmtDate(data.endDate)}
Duration: ${durationLabel(data)}
Reason: ${data.reason || '—'}
Status: Pending review${slgTextFooter()}`;

  return { subject, html, text };
}

/**
 * Decision notice to the requester — approved or denied.
 */
export function generateDecisionEmail(data: VacationRequestData & {
  decision: 'approved' | 'denied';
  adminComment?: string;
  reviewedBy?: string;
}): { subject: string; html: string; text: string } {
  const isApproved = data.decision === 'approved';
  const accent: EmailAccent = isApproved ? 'green' : 'red';
  const subject = `Your vacation request was ${isApproved ? 'approved' : 'declined'}`;

  const rows = [
    { label: 'Type', value: data.type },
    { label: 'Start date', value: fmtDate(data.startDate) },
    { label: 'End date', value: fmtDate(data.endDate) },
    { label: 'Duration', value: durationLabel(data) },
    { label: 'Decision', value: isApproved ? 'Approved' : 'Declined' },
  ];
  if (data.reviewedBy) rows.push({ label: 'Reviewed by', value: data.reviewedBy });
  if (data.adminComment) rows.push({ label: 'Comment', value: data.adminComment });

  const intro = isApproved
    ? `Hi ${data.userName}, good news — your vacation request has been approved. Enjoy your time off.`
    : `Hi ${data.userName}, your vacation request was not approved this time. See the details below; feel free to reach out if you have questions.`;

  const bodyHtml = paragraph(intro) + detailsRow(detailsTable(rows));

  const html = renderSlgEmail({
    title: subject,
    eyebrow: isApproved ? 'Approved' : 'Declined',
    heading: isApproved ? 'Your request is approved' : 'Your request was declined',
    accent,
    bodyHtml,
    preheader: `${fmtDate(data.startDate)} → ${fmtDate(data.endDate)}`,
  });

  const text = `Hi ${data.userName},

Your vacation request was ${isApproved ? 'APPROVED' : 'DECLINED'}.

Type: ${data.type}
Start: ${fmtDate(data.startDate)}
End: ${fmtDate(data.endDate)}
Duration: ${durationLabel(data)}${data.reviewedBy ? `\nReviewed by: ${data.reviewedBy}` : ''}${data.adminComment ? `\nComment: ${data.adminComment}` : ''}${slgTextFooter()}`;

  return { subject, html, text };
}

/**
 * Admin-side notification that a request was reviewed (for the other admins).
 */
export function generateAdminReviewNotificationEmail(data: AdminReviewNotificationData): { subject: string; html: string; text: string } {
  const adminUrl = adminVacationRequestUrl(data.id, data.locale || 'en');
  const isApproved = data.decision === 'approved';
  const accent: EmailAccent = isApproved ? 'green' : 'red';
  const subject = `${data.userName}'s request was ${isApproved ? 'approved' : 'declined'} by ${data.reviewedBy}`;

  const rows = [
    { label: 'Employee', value: `${data.userName} <span style="color:rgba(39,51,65,0.7)">${data.userEmail}</span>` },
    { label: 'Company', value: data.company || 'Unknown' },
    { label: 'Type', value: data.type },
    { label: 'Start date', value: fmtDate(data.startDate) },
    { label: 'End date', value: fmtDate(data.endDate) },
    { label: 'Duration', value: durationLabel(data) },
    { label: 'Decision', value: isApproved ? 'Approved' : 'Declined' },
    { label: 'Reviewed by', value: `${data.reviewedBy} <span style="color:rgba(39,51,65,0.7)">${data.reviewerEmail}</span>` },
    { label: 'Reviewed at', value: new Date(data.reviewedAt).toLocaleString('en-US') },
  ];
  if (data.adminComment) rows.push({ label: 'Comment', value: data.adminComment });

  const bodyHtml =
    paragraph(`This request has been reviewed. No further action is required — this is for your records.`) +
    detailsRow(detailsTable(rows));

  const html = renderSlgEmail({
    title: subject,
    eyebrow: isApproved ? 'Approved' : 'Declined',
    heading: `Request ${isApproved ? 'approved' : 'declined'}`,
    accent,
    bodyHtml,
    cta: { label: 'Open in admin', url: adminUrl },
    preheader: `${data.userName} · reviewed by ${data.reviewedBy}`,
  });

  const text = `Request reviewed

Employee: ${data.userName} (${data.userEmail})
Company: ${data.company || 'Unknown'}
Type: ${data.type}
Start: ${fmtDate(data.startDate)}
End: ${fmtDate(data.endDate)}
Duration: ${durationLabel(data)}
Decision: ${isApproved ? 'Approved' : 'Declined'}
Reviewed by: ${data.reviewedBy} (${data.reviewerEmail})
Reviewed at: ${new Date(data.reviewedAt).toLocaleString('en-US')}${data.adminComment ? `\nComment: ${data.adminComment}` : ''}

Open in admin: ${adminUrl}${slgTextFooter()}`;

  return { subject, html, text };
}
