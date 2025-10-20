/**
 * Localized Email Service
 * Handles email sending with proper headers and localization
 */

import { getTranslations } from 'next-intl/server';
import { VacationRequest } from '@/types/vacation';
import { getVacationTypeLabelFromTranslations } from '@/lib/vacation-types';
import { sendEmailToRecipients } from '@/lib/email-notifications';

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

/**
 * Generic function to send localized emails based on template type
 */
export async function sendLocalizedEmail(
  templateKey: 'submissionConfirmation' | 'approvalNotice' | 'denialNotice',
  data: GenericLocalizedEmailData,
  recipients: string[]
) {
  const t = await getTranslations({ locale: data.locale, namespace: `emails.${templateKey}` });
  const tVacations = await getTranslations({ locale: data.locale, namespace: 'vacations' });

  const formattedStartDate = new Date(data.startDate).toLocaleDateString(data.locale);
  const formattedEndDate = new Date(data.endDate).toLocaleDateString(data.locale);
  const vacationTypeLabel = getVacationTypeLabelFromTranslations(data.type, tVacations);

  const subject = t('subject', { type: vacationTypeLabel });
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: ${templateKey === 'approvalNotice' ? '#059669' : templateKey === 'denialNotice' ? '#dc2626' : '#2563eb'};">
        ${t('greeting', { name: data.userName })}
      </h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        ${t('body')}
      </p>
      
      <div style="background-color: ${templateKey === 'approvalNotice' ? '#f0fdf4' : templateKey === 'denialNotice' ? '#fef2f2' : '#f9fafb'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${templateKey === 'approvalNotice' ? '#059669' : templateKey === 'denialNotice' ? '#dc2626' : '#e5e7eb'};">
        <h3 style="color: #111827; margin-top: 0;">${t('details')}</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>${t('type', { type: vacationTypeLabel })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('duration', { duration: data.durationDays || 1 })}</strong></li>
          ${data.reason ? `<li style="margin: 8px 0;"><strong>${t('reason', { reason: data.reason })}</strong></li>` : ''}
  `;

  if (templateKey === 'approvalNotice' && data.approvedBy) {
    htmlBody += `<li style="margin: 8px 0;"><strong>${t('approvedBy', { approvedBy: data.approvedBy })}</strong></li>`;
  } else if (templateKey === 'denialNotice' && data.deniedBy) {
    htmlBody += `<li style="margin: 8px 0;"><strong>${t('deniedBy', { deniedBy: data.deniedBy })}</strong></li>`;
    if (data.adminComment) {
      htmlBody += `<li style="margin: 8px 0;"><strong>${t('adminComment', { adminComment: data.adminComment })}</strong></li>`;
    }
  } else if (templateKey === 'submissionConfirmation') {
    htmlBody += `<li style="margin: 8px 0;"><strong>${t('status')}</strong></li>`;
  }

  htmlBody += `
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        ${t('footer')}
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #374151;">
          ${t('signature')}
        </p>
      </div>
    </div>
  `;

  const textBody = `
${t('greeting', { name: data.userName })}

${t('body')}

${t('details')}
${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate: formattedStartDate, endDate: formattedEndDate })}
${t('duration', { duration: data.durationDays || 1 })}
${data.reason ? t('reason', { reason: data.reason }) : ''}
${templateKey === 'approvalNotice' && data.approvedBy ? t('approvedBy', { approvedBy: data.approvedBy }) : ''}
${templateKey === 'denialNotice' && data.deniedBy ? t('deniedBy', { deniedBy: data.deniedBy }) : ''}
${templateKey === 'denialNotice' && data.adminComment ? t('adminComment', { adminComment: data.adminComment }) : ''}
${templateKey === 'submissionConfirmation' ? t('status') : ''}

${t('footer')}

${t('signature')}
  `;

  await sendEmailToRecipients(
    recipients,
    subject,
    htmlBody,
    textBody
  );
}

/**
 * Send localized submission confirmation email
 */
export async function sendLocalizedSubmissionConfirmation(data: LocalizedEmailData) {
  const t = await getTranslations({ locale: data.locale, namespace: 'emails.submissionConfirmation' });
  
  // Get localized vacation type
  const vacationTypeLabel = getVacationTypeLabelFromTranslations(data.request.type || '', (key: string) => t(key));
  
  // Format dates
  const startDate = new Date(data.request.startDate).toLocaleDateString(data.locale);
  const endDate = new Date(data.request.endDate).toLocaleDateString(data.locale);
  
  // Calculate duration
  const duration = data.request.durationDays || 
    Math.ceil((new Date(data.request.endDate).getTime() - new Date(data.request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const subject = t('subject', { type: vacationTypeLabel });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">${t('greeting', { name: data.request.userName })}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        ${t('body')}
      </p>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #111827; margin-top: 0;">${t('details')}</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>${t('type', { type: vacationTypeLabel })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('dates', { startDate, endDate })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('duration', { duration })}</strong></li>
          ${data.request.reason ? `<li style="margin: 8px 0;"><strong>${t('reason', { reason: data.request.reason })}</strong></li>` : ''}
          <li style="margin: 8px 0;"><strong>${t('status')}</strong></li>
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        ${t('footer')}
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #374151;">
          ${t('signature')}
        </p>
      </div>
    </div>
  `;
  
  const text = `
${t('greeting', { name: data.request.userName })}

${t('body')}

${t('details')}
${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate, endDate })}
${t('duration', { duration })}
${data.request.reason ? t('reason', { reason: data.request.reason }) : ''}
${t('status')}

${t('footer')}

${t('signature')}
  `;
  
  await sendEmailToRecipients(
    [data.request.userEmail],
    subject,
    html,
    text
  );
}

/**
 * Send localized approval notice email
 */
export async function sendLocalizedApprovalNotice(data: LocalizedEmailData) {
  const t = await getTranslations({ locale: data.locale, namespace: 'emails.approvalNotice' });
  
  // Get localized vacation type
  const vacationTypeLabel = getVacationTypeLabelFromTranslations(data.request.type || '', (key: string) => t(key));
  
  // Format dates
  const startDate = new Date(data.request.startDate).toLocaleDateString(data.locale);
  const endDate = new Date(data.request.endDate).toLocaleDateString(data.locale);
  
  // Calculate duration
  const duration = data.request.durationDays || 
    Math.ceil((new Date(data.request.endDate).getTime() - new Date(data.request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const subject = t('subject', { type: vacationTypeLabel });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">${t('greeting', { name: data.request.userName })}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        ${t('body')}
      </p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
        <h3 style="color: #111827; margin-top: 0;">${t('details')}</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>${t('type', { type: vacationTypeLabel })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('dates', { startDate, endDate })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('duration', { duration })}</strong></li>
          ${data.request.reason ? `<li style="margin: 8px 0;"><strong>${t('reason', { reason: data.request.reason })}</strong></li>` : ''}
          ${data.approvedBy ? `<li style="margin: 8px 0;"><strong>${t('approvedBy', { approvedBy: data.approvedBy })}</strong></li>` : ''}
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        ${t('footer')}
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #374151;">
          ${t('signature')}
        </p>
      </div>
    </div>
  `;
  
  const text = `
${t('greeting', { name: data.request.userName })}

${t('body')}

${t('details')}
${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate, endDate })}
${t('duration', { duration })}
${data.request.reason ? t('reason', { reason: data.request.reason }) : ''}
${data.approvedBy ? t('approvedBy', { approvedBy: data.approvedBy }) : ''}

${t('footer')}

${t('signature')}
  `;
  
  await sendEmailToRecipients(
    [data.request.userEmail],
    subject,
    html,
    text
  );
}

/**
 * Send localized denial notice email
 */
export async function sendLocalizedDenialNotice(data: LocalizedEmailData) {
  const t = await getTranslations({ locale: data.locale, namespace: 'emails.denialNotice' });
  
  // Get localized vacation type
  const vacationTypeLabel = getVacationTypeLabelFromTranslations(data.request.type || '', (key: string) => t(key));
  
  // Format dates
  const startDate = new Date(data.request.startDate).toLocaleDateString(data.locale);
  const endDate = new Date(data.request.endDate).toLocaleDateString(data.locale);
  
  // Calculate duration
  const duration = data.request.durationDays || 
    Math.ceil((new Date(data.request.endDate).getTime() - new Date(data.request.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  const subject = t('subject', { type: vacationTypeLabel });
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">${t('greeting', { name: data.request.userName })}</h2>
      
      <p style="font-size: 16px; line-height: 1.6; color: #374151;">
        ${t('body')}
      </p>
      
      <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #111827; margin-top: 0;">${t('details')}</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="margin: 8px 0;"><strong>${t('type', { type: vacationTypeLabel })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('dates', { startDate, endDate })}</strong></li>
          <li style="margin: 8px 0;"><strong>${t('duration', { duration })}</strong></li>
          ${data.request.reason ? `<li style="margin: 8px 0;"><strong>${t('reason', { reason: data.request.reason })}</strong></li>` : ''}
          ${data.deniedBy ? `<li style="margin: 8px 0;"><strong>${t('deniedBy', { deniedBy: data.deniedBy })}</strong></li>` : ''}
          ${data.adminComment ? `<li style="margin: 8px 0;"><strong>${t('adminComment', { adminComment: data.adminComment })}</strong></li>` : ''}
        </ul>
      </div>
      
      <p style="font-size: 14px; color: #6b7280;">
        ${t('footer')}
      </p>
      
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 14px; color: #374151;">
          ${t('signature')}
        </p>
      </div>
    </div>
  `;
  
  const text = `
${t('greeting', { name: data.request.userName })}

${t('body')}

${t('details')}
${t('type', { type: vacationTypeLabel })}
${t('dates', { startDate, endDate })}
${t('duration', { duration })}
${data.request.reason ? t('reason', { reason: data.request.reason }) : ''}
${data.deniedBy ? t('deniedBy', { deniedBy: data.deniedBy }) : ''}
${data.adminComment ? t('adminComment', { adminComment: data.adminComment }) : ''}

${t('footer')}

${t('signature')}
  `;
  
  await sendEmailToRecipients(
    [data.request.userEmail],
    subject,
    html,
    text
  );
}