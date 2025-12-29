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
  manuallyTriggered?: boolean;
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
  
  const htmlWithCSV = `${html}
    <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    <h3 style="margin: 16px 0 8px;">CSV Data (${filename}):</h3>
    <pre style="background-color: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 12px; line-height: 1.4;">${csvContent}</pre>
  `;
  
  const result = await sendEmailWithFallbacks(recipients, subject, htmlWithCSV);
  
  if (result.success) {
    console.log(`✅ Monthly summary email sent successfully to ${recipients.join(', ')}`);
  } else {
    console.error(`❌ Failed to send monthly summary email to ${recipients.join(', ')}:`, result.error);
  }
  
  return result;
}

function generateHTML(approved: VacationRow[], range: MonthRange, totalDays: number): string {
  let tableRows = '';
  if (approved.length === 0) {
    tableRows = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No validated vacations for this month.</td></tr>';
  } else {
    console.log(`📋 Generating ${approved.length} table rows (one per request, no deduplication)`);
    tableRows = approved.map(r => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.employee || 'Unknown'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.company || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.type || 'Full day'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.startDate || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.endDate || r.startDate || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatDuration(Number(r.days || 0))}</td>
      </tr>
    `).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        table { width: 100%; border-collapse: collapse; background: white; margin: 16px 0; }
        th { background: #f5f5f5; padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .summary { background: white; padding: 16px; margin: 16px 0; border-radius: 4px; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0 0 8px;">Monthly Vacation Summary</h1>
          <p style="margin: 0; opacity: 0.9;">${range.displayLabel}</p>
        </div>
        
        <div class="content">
          <div class="summary">
            <h2 style="margin: 0 0 12px;">Summary</h2>
            <p style="margin: 4px 0;"><strong>Period:</strong> ${range.startISO} to ${range.endISO}</p>
            <p style="margin: 4px 0;"><strong>Total Validated Vacations:</strong> ${approved.length} requests</p>
            <p style="margin: 4px 0;"><strong>Total Days:</strong> ${totalDays.toFixed(1)} days</p>
          </div>

          <h3 style="margin: 24px 0 12px;">Validated Vacations Details</h3>
          <table>
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Company</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th style="text-align: right;">Days</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <p style="margin-top: 20px; color: #666; font-size: 14px;">
            <em>This summary includes only validated/approved vacation requests for ${range.displayLabel}.</em>
          </p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Stars Vacation Management System</p>
          <p>Generated: ${new Date().toLocaleString('en-US', { timeZone: 'Europe/Monaco' })}</p>
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
  
  // Calculate totals (includes per-employee verification)
  const { totalDays } = calculateTotals(approved);

  // Generate email
  const subject = `Monthly validated vacations summary – ${range.displayLabel}`;
  const html = generateHTML(approved, range, totalDays);
  
  // Generate CSV
  console.log(`📄 Generating CSV with ${approved.length} rows (one per request)`);
  const csv = toCSV(approved);
  const filename = `vacations_${range.label}.csv`;
  
  // Verify CSV row count matches approved count
  const csvRowCount = csv.split('\n').length - 1; // Subtract header row
  if (csvRowCount !== approved.length) {
    console.error(`⚠️ WARNING: CSV row count (${csvRowCount}) does not match approved count (${approved.length})`);
  } else {
    console.log(`✅ CSV row count verified: ${csvRowCount} rows match ${approved.length} approved requests`);
  }

  // Send email
  const emailResult = await sendEmail(subject, html, csv, filename);

  const recipients = getAccountingEmails();
  console.log(`✅ Monthly summary processed successfully for ${range.label}`);
  console.log(`   - Validated vacations: ${approved.length} requests (${totalDays.toFixed(1)} days)`);
  console.log(`   - Email sent to: ${recipients.join(', ')}`);
  console.log(`   - Email result: ${emailResult.success ? 'Success' : 'Failed'}`);
  
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
    emailProvider: emailErrorInfo?.provider,
    emailServiceErrors: emailErrorInfo?.serviceErrors,
    emailSkippedServices: emailErrorInfo?.skippedServices,
    emailConfigurationMissing: emailErrorInfo?.configurationMissing,
    emailConfigurationHelp: emailErrorInfo?.configurationHelp,
    isTestService: 'isTestService' in emailResult ? emailResult.isTestService : false,
    emailWarning: ('warning' in emailResult ? String(emailResult.warning) : undefined) as string | undefined,
    previewUrl: ('previewUrl' in emailResult ? String(emailResult.previewUrl) : undefined) as string | undefined,
    manuallyTriggered
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

