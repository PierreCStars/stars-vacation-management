/**
 * Shared processing logic for monthly vacation summary
 * 
 * This module contains the core logic for generating monthly summaries,
 * used by both GET (cron) and POST (manual trigger) endpoints.
 */

import { 
  getMonthRangeInTimezone, 
  getValidatedVacationsForMonth, 
  calculateTotals,
  type VacationRow,
  type MonthRange
} from "@/lib/monthly-vacation-helper";
import { formatDuration } from "@/lib/duration-calculator";
import { sendEmailWithFallbacks } from "@/lib/simple-email-service";

export interface MonthlySummaryResult {
  ok: boolean;
  month: string;
  displayLabel: string;
  validated: number;
  totalDays: number;
  dateRange: { start: string; end: string };
  recipients: string[];
  emailSent: boolean;
  emailError?: string;
  emailProvider?: string;
  emailServiceErrors?: Array<{ service: string; error: string }>;
  emailSkippedServices?: Array<{ service: string; reason: string }>;
  emailConfigurationMissing?: boolean;
  emailConfigurationHelp?: any;
  isTestService?: boolean;
  emailWarning?: string;
  previewUrl?: string;
  messageId?: string;
  manuallyTriggered?: boolean;
  employeeBreakdown?: Array<{ employee: string; requestCount: number; totalDays: number; vacationIds: string[] }>;
}

function toCSV(rows: VacationRow[]): string {
  if (!rows.length) return "employee,company,type,status,startDate,endDate,days\n";
  const headers = ['employee', 'company', 'type', 'status', 'startDate', 'endDate', 'days'];
  const esc = (val: any) => {
    const s = (val ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => esc((r as any)[h])).join(","))].join("\n");
}

function getAccountingEmails(): string[] {
  if (process.env.ACCOUNTING_EMAIL) {
    return process.env.ACCOUNTING_EMAIL
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);
  }
  return ['compta@stars.mc', 'pierre@stars.mc'];
}

async function sendEmail(subject: string, html: string, csvContent: string, filename: string) {
  const recipients = getAccountingEmails();
  console.log(`📧 Sending monthly summary email to ${recipients.join(', ')}...`);
  console.log('Subject:', subject);
  
  // Plus de dump CSV brut dans le corps (non conforme à la charte) — le tableau
  // récapitulatif suffit ; l'export détaillé se fait via Google Sheet.
  void csvContent; void filename;
  const result = await sendEmailWithFallbacks(recipients, subject, html);
  
  if (result.success) {
    console.log(`✅ Monthly summary email sent successfully to ${recipients.join(', ')}`);
  } else {
    console.error(`❌ Failed to send monthly summary email to ${recipients.join(', ')}:`, result.error);
  }
  
  return result;
}

function generateHTML(approved: VacationRow[], range: MonthRange, totalDays: number): string {
  const esc = (s: string) => (s || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cellBase = 'padding:10px 12px;border-bottom:1px solid #E7E2D8;font-size:14px;color:#0A0A0A;';

  let tableRows = '';
  if (approved.length === 0) {
    tableRows = `<tr><td colspan="6" style="text-align:center;padding:24px;color:#273341;font-size:14px;">Aucun congé validé sur cette période.</td></tr>`;
  } else {
    tableRows = approved.map((r, index) => {
      const uniqueId = r.id || `row-${index}`;
      return `
      <tr data-vacation-id="${uniqueId}" data-employee="${(r.employee || 'Unknown').replace(/"/g, '&quot;')}" data-index="${index}">
        <td style="${cellBase}font-weight:500;">${esc(r.employee || 'Inconnu')}</td>
        <td style="${cellBase}">${esc(r.company || '—')}</td>
        <td style="${cellBase}">${esc(r.type || 'Journée complète')}</td>
        <td style="${cellBase}">${r.startDate || '—'}</td>
        <td style="${cellBase}">${r.endDate || r.startDate || '—'}</td>
        <td style="${cellBase}text-align:right;">${formatDuration(Number(r.days || 0))}</td>
      </tr>`;
    }).join('');
  }

  const th = 'padding:10px 12px;text-align:left;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#273341;border-bottom:2px solid #D8B11B;';

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
    </head>
    <body style="margin:0;padding:0;background:#F5F2EC;font-family:'Montserrat',Arial,sans-serif;color:#0A0A0A;">
      <div style="max-width:760px;margin:0 auto;padding:32px 20px;">
        <div style="background:#FFFFFF;border:1px solid #E7E2D8;">
          <!-- Header -->
          <div style="padding:28px 28px 20px;border-bottom:2px solid #D8B11B;">
            <div style="font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#273341;margin-bottom:10px;">Star Luxury Group</div>
            <h1 style="margin:0;font-size:24px;font-weight:300;letter-spacing:-0.01em;color:#0A0A0A;">Récap mensuel des congés validés</h1>
            <p style="margin:6px 0 0;font-size:14px;color:#273341;">${range.displayLabel}</p>
          </div>
          <!-- Body -->
          <div style="padding:24px 28px;">
            <div style="background:#F5F2EC;border-left:3px solid #D8B11B;padding:14px 16px;margin-bottom:24px;">
              <p style="margin:3px 0;font-size:14px;color:#273341;">Période : <strong style="color:#0A0A0A;">${range.startISO} → ${range.endISO}</strong></p>
              <p style="margin:3px 0;font-size:14px;color:#273341;">Congés validés : <strong style="color:#0A0A0A;">${approved.length}</strong></p>
              <p style="margin:3px 0;font-size:14px;color:#273341;">Total jours ouvrés : <strong style="color:#0A0A0A;">${totalDays.toFixed(1)}</strong></p>
            </div>

            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr>
                  <th style="${th}">Employé</th>
                  <th style="${th}">Société</th>
                  <th style="${th}">Type</th>
                  <th style="${th}">Début</th>
                  <th style="${th}">Fin</th>
                  <th style="${th}text-align:right;">Jours</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>

            <p style="margin-top:20px;font-size:12px;color:#273341;font-style:italic;">
              Récapitulatif des congés validés pour ${range.displayLabel} (jours ouvrés uniquement — week-ends et fériés monégasques exclus).
            </p>
          </div>
          <!-- Footer -->
          <div style="padding:16px 28px;border-top:1px solid #E7E2D8;">
            <p style="margin:0;font-size:11px;color:#273341;">© ${new Date().getFullYear()} Star Luxury Group — Stars Vacation Management</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Process monthly vacation summary
 * 
 * This is the main function that:
 * 1. Gets month range in Monaco timezone
 * 2. Fetches validated vacations for the month
 * 3. Calculates totals (preserving fractional days)
 * 4. Generates HTML email and CSV
 * 5. Sends email to accounting
 * 
 * @param manuallyTriggered Whether this was triggered manually (POST) or by cron (GET)
 * @returns MonthlySummaryResult with all details
 */
export async function processMonthlySummary(manuallyTriggered = false): Promise<MonthlySummaryResult> {
  try {
    // Get month range in Monaco timezone (CRITICAL: fixes timezone bug)
    const range = getMonthRangeInTimezone("Europe/Monaco");
    console.log(`📅 Processing monthly summary for ${range.label} (${range.startISO} to ${range.endISO})`);

  // Get validated vacations using shared helper (ensures no deduplication, preserves 0.5 days)
  let approved: VacationRow[];
  try {
    approved = await getValidatedVacationsForMonth(range.startISO, range.endISO);
  } catch (fetchError) {
    console.error('❌ Error fetching validated vacations:', fetchError);
    const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
    throw new Error(`Failed to fetch vacation requests: ${errorMessage}`);
  }
  
  // Calculate totals
  const { totalDays } = calculateTotals(approved);
  
  // Build employee breakdown for API response (only employees with multiple vacations)
  const employeeVacationMap = new Map<string, VacationRow[]>();
  approved.forEach(r => {
    const emp = r.employee || "Unknown";
    if (!employeeVacationMap.has(emp)) {
      employeeVacationMap.set(emp, []);
    }
    employeeVacationMap.get(emp)!.push(r);
  });
  
  const employeesWithMultiple = Array.from(employeeVacationMap.entries())
    .filter(([_, vacations]) => vacations.length > 1);

  // Sort by employee name, then by start date for consistent ordering
  const sortedApproved = [...approved].sort((a, b) => {
    const empCompare = (a.employee || '').localeCompare(b.employee || '');
    if (empCompare !== 0) return empCompare;
    return (a.startDate || '').localeCompare(b.startDate || '');
  });
  
  // Generate email
  const subject = `Récap mensuel des congés validés – ${range.displayLabel}`;
  const html = generateHTML(sortedApproved, range, totalDays);
  
  // Generate CSV (sorted by employee name, then by start date)
  const csv = toCSV(sortedApproved);
  const filename = `vacations_${range.label}.csv`;

  // Send email
  const emailResult = await sendEmail(subject, html, csv, filename);

  const recipients = getAccountingEmails();
  console.log(`✅ Monthly summary processed successfully for ${range.label}`);
  console.log(`   - Validated vacations: ${approved.length} requests (${totalDays.toFixed(1)} days)`);
  console.log(`   - Email sent to: ${recipients.join(', ')}`);
  console.log(`   - Email result: ${emailResult.success ? 'Success' : 'Failed'}`);
  console.log(`   - Email provider: ${'provider' in emailResult ? emailResult.provider : 'unknown'}`);
  console.log(`   - Is test service: ${'isTestService' in emailResult ? emailResult.isTestService : false}`);
  if ('messageId' in emailResult && emailResult.messageId) {
    console.log(`   - Message ID: ${emailResult.messageId}`);
  }
  if ('previewUrl' in emailResult && emailResult.previewUrl) {
    console.log(`   - Preview URL: ${emailResult.previewUrl}`);
  }
  
  if (!emailResult.success) {
    console.error(`❌ Email sending failed:`, emailResult.error);
    const provider = 'provider' in emailResult ? emailResult.provider : undefined;
    const fallback = 'fallback' in emailResult ? emailResult.fallback : undefined;
    console.error(`   Provider: ${provider || fallback || 'unknown'}`);
    
    if ('errors' in emailResult && Array.isArray(emailResult.errors)) {
      console.error('   Service failures:');
      emailResult.errors.forEach((err: any) => {
        console.error(`     - ${err.service}: ${err.error}`);
      });
    }
    
    if ('configurationMissing' in emailResult && emailResult.configurationMissing) {
      console.error('   ⚠️ No email providers configured in production!');
    }
  } else if ('isTestService' in emailResult && emailResult.isTestService) {
    console.error(`⚠️ WARNING: Email sent via TEST SERVICE (Ethereal). Real emails were NOT delivered!`);
    const previewUrl = 'previewUrl' in emailResult ? emailResult.previewUrl : undefined;
    console.error(`   Preview URL: ${previewUrl || 'N/A'}`);
    console.error(`   This means all real email services (SMTP, Resend, Gmail) failed.`);
    console.error(`   Please check email service configuration.`);
  }

  // Serialize error information safely for client
  const emailErrorInfo = emailResult.success ? undefined : {
    message: (emailResult.error ? String(emailResult.error) : 'Unknown error') as string,
    provider: (('provider' in emailResult ? emailResult.provider : undefined) || ('fallback' in emailResult ? emailResult.fallback : undefined)) as string | undefined,
    serviceErrors: ('errors' in emailResult && Array.isArray(emailResult.errors)) 
      ? emailResult.errors.map((err: any) => ({ service: err.service, error: err.error }))
      : undefined,
    skippedServices: ('skippedServices' in emailResult && Array.isArray(emailResult.skippedServices))
      ? emailResult.skippedServices
      : undefined,
    configurationMissing: 'configurationMissing' in emailResult ? emailResult.configurationMissing : false,
    configurationHelp: 'configurationHelp' in emailResult ? emailResult.configurationHelp : undefined
  };

  // Get provider info (for both success and failure cases)
  const provider = ('provider' in emailResult ? emailResult.provider : undefined) || 
                   ('fallback' in emailResult ? emailResult.fallback : undefined) ||
                   'unknown';

  // Add diagnostic information to help verify all vacations are included
  const employeeBreakdown = Array.from(employeeVacationMap.entries()).map(([emp, vacations]) => ({
    employee: emp,
    requestCount: vacations.length,
    totalDays: vacations.reduce((sum, v) => sum + (v.days || 0), 0),
    vacationIds: vacations.map(v => v.id).filter((id): id is string => Boolean(id))
  }));

  return {
    ok: true,
    month: range.label,
    displayLabel: range.displayLabel,
    validated: approved.length,
    totalDays: parseFloat(totalDays.toFixed(1)),
    dateRange: { start: range.startISO, end: range.endISO },
    recipients: recipients,
    emailSent: emailResult.success && !('isTestService' in emailResult && emailResult.isTestService),
    emailError: emailErrorInfo?.message,
    emailProvider: emailErrorInfo?.provider || (emailResult.success ? provider : undefined),
    emailServiceErrors: emailErrorInfo?.serviceErrors,
    emailSkippedServices: emailErrorInfo?.skippedServices,
    emailConfigurationMissing: emailErrorInfo?.configurationMissing,
    emailConfigurationHelp: emailErrorInfo?.configurationHelp,
    isTestService: 'isTestService' in emailResult ? emailResult.isTestService : false,
    emailWarning: ('warning' in emailResult ? String(emailResult.warning) : undefined) as string | undefined,
    previewUrl: ('previewUrl' in emailResult ? String(emailResult.previewUrl) : undefined) as string | undefined,
    messageId: ('messageId' in emailResult ? String(emailResult.messageId) : undefined) as string | undefined,
    manuallyTriggered,
    // Diagnostic information to help verify fix
    employeeBreakdown: employeesWithMultiple.length > 0 ? employeeBreakdown.filter(e => e.requestCount > 1) : undefined
  };
  } catch (error) {
    console.error('❌ Error in processMonthlySummary:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error details:', { message: errorMessage, stack: errorStack });
    
    // Return error result instead of throwing
    return {
      ok: false,
      month: '',
      displayLabel: '',
      validated: 0,
      totalDays: 0,
      dateRange: { start: '', end: '' },
      recipients: getAccountingEmails(),
      emailSent: false,
      emailError: errorMessage,
      manuallyTriggered
    };
  }
}

