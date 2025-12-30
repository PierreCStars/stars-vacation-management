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
    // CRITICAL: Log all approved vacations to verify no deduplication
    console.log(`📋 Generating ${approved.length} table rows (one per request, no deduplication)`);
    console.log(`📋 All approved vacations being included in HTML table:`, approved.map(r => ({
      employee: r.employee,
      startDate: r.startDate,
      endDate: r.endDate,
      days: r.days,
      id: r.id
    })));
    
    // Verify employee distribution
    const employeeCounts = new Map<string, number>();
    approved.forEach(r => {
      const emp = r.employee || "Unknown";
      employeeCounts.set(emp, (employeeCounts.get(emp) || 0) + 1);
    });
    const employeesWithMultiple = Array.from(employeeCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([emp, count]) => `${emp}: ${count} requests`);
    if (employeesWithMultiple.length > 0) {
      console.log(`📋 HTML Table: Employees with multiple requests: ${employeesWithMultiple.join(', ')}`);
    }
    
    // CRITICAL: Use map() to create one row per vacation - NO deduplication
    // Add a unique data attribute to each row to help debug if rows are being collapsed
    // IMPORTANT: Do NOT sort, filter, or deduplicate - preserve exact order and all entries
    console.log(`📋 Starting HTML row generation for ${approved.length} vacations (NO sorting, NO filtering, NO deduplication)`);
    tableRows = approved.map((r, index) => {
      const uniqueId = r.id || `row-${index}`;
      const rowNumber = index + 1;
      console.log(`📋 HTML Row ${rowNumber}/${approved.length}: Employee="${r.employee}", Start="${r.startDate}", End="${r.endDate}", Days=${r.days}, ID="${uniqueId}"`);
      
      // CRITICAL: Each row must be unique - add index to ensure uniqueness even if IDs are missing
      const rowHtml = `
      <tr data-vacation-id="${uniqueId}" data-employee="${(r.employee || 'Unknown').replace(/"/g, '&quot;')}" data-index="${index}" data-row-number="${rowNumber}">
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${(r.employee || 'Unknown').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${(r.company || '—').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${(r.type || 'Full day').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.startDate || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.endDate || r.startDate || '—'}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatDuration(Number(r.days || 0))}</td>
      </tr>
    `;
      
      // Verify this row contains the expected data
      if (!rowHtml.includes(r.employee || 'Unknown')) {
        console.error(`❌ CRITICAL: Row ${rowNumber} HTML does not contain employee name "${r.employee}"!`);
      }
      if (!rowHtml.includes(r.startDate || '—')) {
        console.error(`❌ CRITICAL: Row ${rowNumber} HTML does not contain start date "${r.startDate}"!`);
      }
      
      return rowHtml;
    }).join('');
    
    console.log(`📋 Completed HTML row generation: Generated ${approved.length} rows`);
    
    console.log(`📋 Generated ${approved.length} HTML table rows (should match approved.length)`);
    
    // CRITICAL: Verify the HTML actually contains all rows by counting <tr> tags
    const rowCountInHTML = (tableRows.match(/<tr>/g) || []).length;
    if (rowCountInHTML !== approved.length) {
      console.error(`❌ CRITICAL ERROR: HTML table has ${rowCountInHTML} rows but approved.length is ${approved.length}! Data loss in HTML generation!`);
      console.error(`   This indicates some vacations were not included in the HTML table.`);
      console.error(`   Approved vacations:`, approved.map(r => ({ id: r.id, employee: r.employee, startDate: r.startDate })));
    } else {
      console.log(`✅ Verified: HTML table contains ${rowCountInHTML} rows matching ${approved.length} approved vacations`);
    }
    
    // CRITICAL SAFEGUARD: Verify all vacation IDs are present in HTML
    const htmlVacationIds = new Set<string>();
    const idMatches = tableRows.match(/data-vacation-id="([^"]+)"/g) || [];
    idMatches.forEach(match => {
      const id = match.match(/data-vacation-id="([^"]+)"/)?.[1];
      if (id) htmlVacationIds.add(id);
    });
    
    const approvedIds = new Set(approved.map(r => r.id).filter((id): id is string => Boolean(id)));
    const missingIds = Array.from(approvedIds).filter(id => !htmlVacationIds.has(id));
    const extraIds = Array.from(htmlVacationIds).filter(id => !approvedIds.has(id));
    
    if (missingIds.length > 0) {
      console.error(`❌ CRITICAL ERROR: ${missingIds.length} vacation IDs are missing from HTML table:`, missingIds);
    }
    if (extraIds.length > 0) {
      console.error(`❌ CRITICAL ERROR: ${extraIds.length} unexpected vacation IDs found in HTML table:`, extraIds);
    }
    if (missingIds.length === 0 && extraIds.length === 0) {
      console.log(`✅ Verified: All ${approvedIds.size} vacation IDs are present in HTML table`);
    }
    
    // CRITICAL: Log a sample of the HTML to verify structure
    const sampleRows = tableRows.split('</tr>').slice(0, 3).map(r => r.substring(0, 200) + '...');
    console.log(`📋 Sample HTML rows (first 3, truncated):`, sampleRows);
    
    // CRITICAL: Count unique employee names in the HTML to detect if email client is collapsing
    const employeeNamesInHTML = new Set<string>();
    const employeeMatches = tableRows.match(/data-employee="([^"]+)"/g) || [];
    employeeMatches.forEach(match => {
      const emp = match.match(/data-employee="([^"]+)"/)?.[1];
      if (emp) employeeNamesInHTML.add(emp);
    });
    console.log(`📋 Unique employee names in HTML: ${employeeNamesInHTML.size} (should be <= ${approved.length})`);
    if (employeeNamesInHTML.size < approved.length) {
      console.log(`📋 Employee names in HTML:`, Array.from(employeeNamesInHTML));
      // Count how many rows per employee
      const rowsPerEmployee = new Map<string, number>();
      employeeMatches.forEach(match => {
        const emp = match.match(/data-employee="([^"]+)"/)?.[1];
        if (emp) rowsPerEmployee.set(emp, (rowsPerEmployee.get(emp) || 0) + 1);
      });
      console.log(`📋 Rows per employee in HTML:`, Object.fromEntries(rowsPerEmployee));
    }
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
  
  // CRITICAL SAFEGUARD: Verify no deduplication occurred
  // Count unique vacation IDs to ensure we have all requests
  const uniqueIds = new Set(approved.map(r => r.id).filter((id): id is string => Boolean(id)));
  if (uniqueIds.size !== approved.length) {
    console.error(`❌ CRITICAL ERROR: Duplicate vacation IDs detected! Expected ${approved.length} unique IDs but found ${uniqueIds.size}`);
    console.error(`   This indicates deduplication occurred. All vacation IDs:`, approved.map(r => r.id));
  } else {
    console.log(`✅ Verified: All ${approved.length} vacations have unique IDs (no deduplication)`);
  }
  
  // CRITICAL SAFEGUARD: Verify employees with multiple requests are preserved
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
  
  if (employeesWithMultiple.length > 0) {
    console.log(`✅ Verified: ${employeesWithMultiple.length} employees have multiple vacations (preserved, not deduplicated):`);
    employeesWithMultiple.forEach(([emp, vacations]) => {
      console.log(`   - ${emp}: ${vacations.length} vacations (IDs: ${vacations.map(v => v.id).join(', ')})`);
    });
  }
  
  // Calculate totals (includes per-employee verification)
  const { totalDays } = calculateTotals(approved);

  // CRITICAL: Log approved vacations before generating HTML to verify no deduplication
  console.log(`📧 About to generate HTML email with ${approved.length} approved vacations`);
  console.log(`📧 Approved vacations breakdown:`, approved.map(r => ({
    employee: r.employee,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days,
    id: r.id
  })));
  
  // Verify employee distribution one more time
  const employeeCountsBeforeHTML = new Map<string, number>();
  approved.forEach(r => {
    const emp = r.employee || "Unknown";
    employeeCountsBeforeHTML.set(emp, (employeeCountsBeforeHTML.get(emp) || 0) + 1);
  });
  console.log(`📧 Employee request counts before HTML generation:`, Object.fromEntries(employeeCountsBeforeHTML));
  const employeesWithMultipleBeforeHTML = Array.from(employeeCountsBeforeHTML.entries())
    .filter(([_, count]) => count > 1)
    .map(([emp, count]) => `${emp}: ${count}`);
  if (employeesWithMultipleBeforeHTML.length > 0) {
    console.log(`📧 Employees with multiple requests before HTML: ${employeesWithMultipleBeforeHTML.join(', ')}`);
  }

  // CRITICAL: Before generating HTML, verify we have all vacations
  // Log a complete breakdown to help diagnose
  console.log(`📧 FINAL VERIFICATION: About to generate HTML with ${approved.length} vacations`);
  const finalBreakdown = approved.map((r, idx) => ({
    index: idx,
    id: r.id,
    employee: r.employee,
    startDate: r.startDate,
    endDate: r.endDate,
    days: r.days
  }));
  console.log(`📧 Complete vacation list being passed to generateHTML:`, JSON.stringify(finalBreakdown, null, 2));
  
  // Generate email
  const subject = `Monthly validated vacations summary – ${range.displayLabel}`;
  const html = generateHTML(approved, range, totalDays);
  
  // CRITICAL: After generating HTML, verify it contains all rows
  const htmlRowMatches = html.match(/<tr data-vacation-id="[^"]+"/g) || [];
  console.log(`📧 HTML contains ${htmlRowMatches.length} <tr> tags with data-vacation-id attributes`);
  if (htmlRowMatches.length !== approved.length) {
    console.error(`❌ CRITICAL: HTML has ${htmlRowMatches.length} rows but should have ${approved.length} rows!`);
  }
  
  // Generate CSV
  console.log(`📄 Generating CSV with ${approved.length} rows (one per request)`);
  const csv = toCSV(approved);
  const filename = `vacations_${range.label}.csv`;
  
  // CRITICAL SAFEGUARD: Verify CSV row count matches approved count
  const csvRowCount = csv.split('\n').length - 1; // Subtract header row
  if (csvRowCount !== approved.length) {
    console.error(`❌ CRITICAL ERROR: CSV row count (${csvRowCount}) does not match approved count (${approved.length})! Data loss in CSV generation!`);
    console.error(`   This indicates some vacations were not included in the CSV.`);
  } else {
    console.log(`✅ CSV row count verified: ${csvRowCount} rows match ${approved.length} approved requests`);
  }
  
  // CRITICAL SAFEGUARD: Verify CSV contains all employee names (including duplicates)
  const csvLines = csv.split('\n').slice(1); // Skip header
  const csvEmployeeCounts = new Map<string, number>();
  csvLines.forEach(line => {
    if (line.trim()) {
      const firstComma = line.indexOf(',');
      if (firstComma > 0) {
        const employee = line.substring(0, firstComma).replace(/^"|"$/g, '');
        csvEmployeeCounts.set(employee, (csvEmployeeCounts.get(employee) || 0) + 1);
      }
    }
  });
  
  // Compare CSV employee counts with approved counts
  const approvedEmployeeCounts = new Map<string, number>();
  approved.forEach(r => {
    const emp = r.employee || "Unknown";
    approvedEmployeeCounts.set(emp, (approvedEmployeeCounts.get(emp) || 0) + 1);
  });
  
  let csvMatches = true;
  for (const [emp, count] of approvedEmployeeCounts.entries()) {
    const csvCount = csvEmployeeCounts.get(emp) || 0;
    if (csvCount !== count) {
      console.error(`❌ CRITICAL ERROR: Employee "${emp}" has ${count} vacations in approved list but only ${csvCount} in CSV!`);
      csvMatches = false;
    }
  }
  
  if (csvMatches) {
    console.log(`✅ CSV employee counts verified: All employees have correct number of rows in CSV`);
  }

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

