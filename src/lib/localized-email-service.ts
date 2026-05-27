/**
 * Localized Email Service
 * Sends employee-facing emails (submission / approval / denial) in the user's
 * locale (FR / EN / IT), wrapped in the shared SLG email shell.
 */

import { getTranslations } from 'next-intl/server';
import { VacationRequest } from '@/types/vacation';
import { getVacationTypeLabelFromTranslations } from '@/lib/vacation-types';
import { sendEmailToRecipients } from '@/lib/email-notifications';
import { renderSlgEmail, detailsTable, slgTextFooter, type EmailAccent } from '@/lib/email/slg-theme';

export interface LocalizedEmailData {
  request: VacationRequest;
  locale: 'en' | 'fr' | 'it';
  approvedBy?: string;
  deniedBy?: string;
  adminComment?: string;
}

export interface GenericLocalizedEmailData extends Omit<LocalizedEmailData, 'request'> {
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company?: string;
  type: string;
  durationDays?: number;
  createdAt?: string;
}

type TemplateKey = 'submissionConfirmation' | 'approvalNotice' | 'denialNotice';

const ACCENT_BY_TEMPLATE: Record<TemplateKey, EmailAccent> = {
  submissionConfirmation: 'gold',
  approvalNotice: 'green',
  denialNotice: 'red',
};

const EYEBROW_BY_TEMPLATE: Record<TemplateKey, string> = {
  submissionConfirmation: 'Request received',
  approvalNotice: 'Approved',
  denialNotice: 'Declined',
};

/**
 * Send a localized employee email wrapped in the SLG shell.
 */
export async function sendLocalizedEmail(
  templateKey: TemplateKey,
  data: GenericLocalizedEmailData,
  recipients: string[],
) {
  const t = await getTranslations({ locale: data.locale, namespace: `emails.${templateKey}` });
  const tVacations = await getTranslations({ locale: data.locale, namespace: 'vacations' });

  const formattedStartDate = new Date(data.startDate).toLocaleDateString(data.locale);
  const formattedEndDate = new Date(data.endDate).toLocaleDateString(data.locale);
  const vacationTypeLabel = getVacationTypeLabelFromTranslations(data.type, tVacations);

  const subject = t('subject', { type: vacationTypeLabel });

  // Build the details rows (translation strings already include their label,
  // e.g. "Type: Paid leave" — we keep them whole on the value side for fidelity).
  const rows: Array<{ label: string; value: string }> = [
    { label: t('type', { type: vacationTypeLabel }), value: vacationTypeLabel },
    { label: t('dates', { startDate: formattedStartDate, endDate: formattedEndDate }), value: `${formattedStartDate} → ${formattedEndDate}` },
    { label: t('duration', { duration: data.durationDays || 1 }), value: `${data.durationDays || 1}` },
  ];
  if (data.reason) rows.push({ label: t('reason', { reason: data.reason }), value: data.reason });
  if (templateKey === 'approvalNotice' && data.approvedBy) {
    rows.push({ label: t('approvedBy', { approvedBy: data.approvedBy }), value: data.approvedBy });
  } else if (templateKey === 'denialNotice' && data.deniedBy) {
    rows.push({ label: t('deniedBy', { deniedBy: data.deniedBy }), value: data.deniedBy });
    if (data.adminComment) rows.push({ label: t('adminComment', { adminComment: data.adminComment }), value: data.adminComment });
  } else if (templateKey === 'submissionConfirmation') {
    rows.push({ label: t('status'), value: '' });
  }

  // The translation strings are already "Label: value" sentences, so render
  // them as a simple definition list rather than a 2-column table to avoid
  // duplicating the label.
  const detailItems = rows
    .map(r => r.label)
    .filter(Boolean)
    .map(line => `<tr><td style="padding:6px 0;border-bottom:1px solid rgba(10,10,10,0.06);font-size:14px;color:#0A0A0A;">${line}</td></tr>`)
    .join('');

  const bodyHtml = `
    <tr><td style="padding:0 0 16px;">${t('body')}</td></tr>
    <tr><td>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;margin:4px 0;">
        ${detailItems}
      </table>
    </td></tr>
    <tr><td style="padding:18px 0 0;font-size:13px;color:rgba(39,51,65,0.8);">${t('footer')}</td></tr>
    <tr><td style="padding:8px 0 0;font-size:13px;color:#0A0A0A;">${t('signature')}</td></tr>
  `;

  const html = renderSlgEmail({
    title: subject,
    eyebrow: EYEBROW_BY_TEMPLATE[templateKey],
    heading: t('greeting', { name: data.userName }),
    accent: ACCENT_BY_TEMPLATE[templateKey],
    bodyHtml,
    preheader: subject,
  });

  const textBody = `${t('greeting', { name: data.userName })}

${t('body')}

${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })}
${t('duration', { duration: data.durationDays || 1 })}
${data.reason ? t('reason', { reason: data.reason }) : ''}
${templateKey === 'approvalNotice' && data.approvedBy ? t('approvedBy', { approvedBy: data.approvedBy }) : ''}
${templateKey === 'denialNotice' && data.deniedBy ? t('deniedBy', { deniedBy: data.deniedBy }) : ''}
${templateKey === 'denialNotice' && data.adminComment ? t('adminComment', { adminComment: data.adminComment }) : ''}
${templateKey === 'submissionConfirmation' ? t('status') : ''}

${t('footer')}
${t('signature')}${slgTextFooter()}`;

  await sendEmailToRecipients(recipients, subject, html, textBody);
}
