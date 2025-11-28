export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { firebaseAdmin, isFirebaseAdminAvailable } from "@/lib/firebase-admin";
import { sendEmailWithFallbacks } from "@/lib/simple-email-service";

type VR = {
  id: string;
  userName?: string; 
  company?: string; 
  type?: string;
  status?: string;
  isHalfDay?: boolean; 
  durationDays?: number;
  startDate?: string; 
  endDate?: string;
  createdAt?: any; 
  reviewedAt?: any;
};

function firstAndLastOfCurrentMonth(tz = "Europe/Monaco") {
  // Compute current month date range
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)); // day 0 of next month
  const yyyy = first.getUTCFullYear();
  const mm = String(first.getUTCMonth() + 1).padStart(2, "0");
  const dd1 = "01";
  const ddL = String(last.getUTCDate()).padStart(2, "0");
  return {
    startISO: `${yyyy}-${mm}-${dd1}`,
    endISO: `${yyyy}-${mm}-${ddL}`,
    label: `${yyyy}-${mm}`
  };
}

function inclusiveDays(startISO?: string, endISO?: string) {
  if (!startISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO || startISO);
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / (24*3600*1000)) + 1;
}

function resolveDuration(v: VR) {
  if (typeof v.durationDays === "number") return v.durationDays;
  if (v.isHalfDay) return 0.5;
  return inclusiveDays(v.startDate, v.endDate);
}

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return "employee,company,type,status,startDate,endDate,days\n";
  const headers = Object.keys(rows[0]);
  const esc = (val: any) => {
    const s = (val ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

// Get accounting email recipients (defaults to compta@stars.mc and pierre@stars.mc)
function getAccountingEmails(): string[] {
  // If ACCOUNTING_EMAIL is set, use it (can be comma-separated)
  if (process.env.ACCOUNTING_EMAIL) {
    return process.env.ACCOUNTING_EMAIL
      .split(',')
      .map(email => email.trim())
      .filter(Boolean);
  }
  // Default recipients: compta@stars.mc and pierre@stars.mc
  return ['compta@stars.mc', 'pierre@stars.mc'];
}

// Send email to accounting department
async function sendEmail(subject: string, html: string, csvContent: string, filename: string) {
  const recipients = getAccountingEmails();
  console.log(`📧 Sending monthly summary email to ${recipients.join(', ')}...`);
  console.log('Subject:', subject);
  
  // Include CSV data in email body as a pre-formatted section
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

// Helper function to check if a vacation overlaps with a date range
function vacationOverlapsMonth(vacation: VR, monthStart: string, monthEnd: string): boolean {
  const vacStart = vacation.startDate || "";
  const vacEnd = vacation.endDate || vacation.startDate || "";
  
  // Vacation overlaps if:
  // - It starts in the month, OR
  // - It ends in the month, OR
  // - It spans the entire month (starts before and ends after)
  return (vacStart >= monthStart && vacStart <= monthEnd) ||
         (vacEnd >= monthStart && vacEnd <= monthEnd) ||
         (vacStart <= monthStart && vacEnd >= monthEnd);
}

export async function GET(req: Request) {
  try {
    // Only send on the 27th of the current month (Europe/Monaco timezone)
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    
    // Check if it's the 27th day of the month
    if (now.getDate() !== 27) {
      return NextResponse.json({ 
        ok: true, 
        skipped: true, 
        reason: "Not 27th of month - monthly summary runs on the 27th to summarize current month",
        currentDate: now.toISOString(),
        currentDay: now.getDate()
      });
    }

    const { startISO, endISO, label } = firstAndLastOfCurrentMonth();
    console.log(`📅 Processing monthly summary for ${label} (${startISO} to ${endISO})`);

    let all: VR[] = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db, error } = await firebaseAdmin();
        
        if (db && !error) {
          // Pull only approved/validated requests (exclude rejected/denied)
          // Status can be "approved", "APPROVED", or "validated" depending on the system
          const snap = await db.collection("vacationRequests")
            .where("status", "in", ["approved", "APPROVED", "validated", "Validated"])
            .get();

          all = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
          console.log(`✅ Fetched ${all.length} approved/validated requests from Firestore`);
        } else {
          console.log('⚠️  Firebase Admin not available - using mock data for monthly summary:', error);
        }
      } else {
        console.log('⚠️  Firebase Admin not available - using mock data for monthly summary');
      }
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      console.log('⚠️  Falling back to mock data for monthly summary...');
    }

    // No mock data fallback - Firebase only

    // Filter requests that overlap with the current month
    // Include ALL vacations that were taken in the month (start, end, or span the month)
    const inRange = all.filter(r => vacationOverlapsMonth(r, startISO, endISO));

    console.log(`📊 Found ${inRange.length} requests in range ${startISO} to ${endISO}`);

    const flat = inRange.map(r => ({
      employee: r.userName || "Unknown",
      company: r.company || "—",
      type: r.type || (r.isHalfDay ? "Half day" : "Full day"),
      status: r.status || "",
      startDate: r.startDate || "",
      endDate: r.endDate || r.startDate || "",
      days: resolveDuration(r)
    }));

    // Filter only approved/validated vacations (exclude rejected)
    // Normalize status to handle variations: approved, APPROVED, validated, Validated
    const approved = flat.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "approved" || status === "validated";
    });
    const totalDays = approved.reduce((s, r) => s + Number(r.days || 0), 0);

    // Format month name for display (e.g., "2025-01" -> "January 2025")
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const [year, month] = label.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    const displayLabel = `${monthName} ${year}`;

    // Build email with HTML table
    const subject = `Monthly validated vacations summary – ${displayLabel}`;
    
    // Create HTML table for validated vacations
    let tableRows = '';
    if (approved.length === 0) {
      tableRows = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No validated vacations for this month.</td></tr>';
    } else {
      tableRows = approved.map(r => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.employee || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.company || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.type || 'Full day'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.startDate || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.endDate || r.startDate || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${r.days || 0}</td>
        </tr>
      `).join('');
    }

    const html = `
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
            <p style="margin: 0; opacity: 0.9;">${displayLabel}</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <h2 style="margin: 0 0 12px;">Summary</h2>
              <p style="margin: 4px 0;"><strong>Period:</strong> ${startISO} to ${endISO}</p>
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
              <em>This summary includes only validated/approved vacation requests for ${displayLabel}.</em>
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
    
    const csv = toCSV(approved);
    const filename = `vacations_${label}.csv`;

    // Send email
    const emailResult = await sendEmail(subject, html, csv, filename);

    const recipients = getAccountingEmails();
    console.log(`✅ Monthly summary processed successfully for ${label}`);
    console.log(`   - Validated vacations: ${approved.length} requests (${totalDays.toFixed(1)} days)`);
    console.log(`   - Email sent to: ${recipients.join(', ')}`);
    console.log(`   - Email result: ${emailResult.success ? 'Success' : 'Failed'}`);
    
    if (!emailResult.success) {
      console.error(`❌ Email sending failed:`, emailResult.error);
      const provider = 'provider' in emailResult ? emailResult.provider : undefined;
      const fallback = 'fallback' in emailResult ? emailResult.fallback : undefined;
      console.error(`   Provider: ${provider || fallback || 'unknown'}`);
      
      // Log detailed error information if available
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
      message: emailResult.error || 'Unknown error',
      provider: ('provider' in emailResult ? emailResult.provider : undefined) || ('fallback' in emailResult ? emailResult.fallback : undefined),
      serviceErrors: ('errors' in emailResult && Array.isArray(emailResult.errors)) 
        ? emailResult.errors.map((err: any) => ({ service: err.service, error: err.error }))
        : undefined,
      skippedServices: ('skippedServices' in emailResult && Array.isArray(emailResult.skippedServices))
        ? emailResult.skippedServices
        : undefined,
      configurationMissing: 'configurationMissing' in emailResult ? emailResult.configurationMissing : false,
      configurationHelp: 'configurationHelp' in emailResult ? emailResult.configurationHelp : undefined
    };

    return NextResponse.json({ 
      ok: true, 
      month: label,
      displayLabel: displayLabel,
      validated: approved.length, 
      totalDays: totalDays.toFixed(1),
      dateRange: { start: startISO, end: endISO },
      recipients: recipients,
      emailSent: emailResult.success && !('isTestService' in emailResult && emailResult.isTestService), // Only true if sent via real service
      emailError: emailErrorInfo?.message,
      emailProvider: emailErrorInfo?.provider,
      emailServiceErrors: emailErrorInfo?.serviceErrors,
      emailSkippedServices: emailErrorInfo?.skippedServices,
      emailConfigurationMissing: emailErrorInfo?.configurationMissing,
      emailConfigurationHelp: emailErrorInfo?.configurationHelp,
      isTestService: 'isTestService' in emailResult ? emailResult.isTestService : false,
      emailWarning: 'warning' in emailResult ? emailResult.warning : undefined,
      previewUrl: 'previewUrl' in emailResult ? emailResult.previewUrl : undefined
    });

  } catch (error) {
    console.error('❌ Error in monthly summary API:', error);
    return NextResponse.json(
      { error: 'Failed to process monthly summary' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger (bypasses date check)
export async function POST(req: Request) {
  try {
    // Allow manual triggering without date restriction
    const { startISO, endISO, label } = firstAndLastOfCurrentMonth();
    console.log(`📅 Manually processing monthly summary for ${label} (${startISO} to ${endISO})`);

    let all: VR[] = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db, error } = await firebaseAdmin();
        
        if (db && !error) {
          // Pull only approved/validated requests (exclude rejected/denied)
          const snap = await db.collection("vacationRequests")
            .where("status", "in", ["approved", "APPROVED", "validated", "Validated"])
            .get();

          all = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
          console.log(`✅ Fetched ${all.length} approved/validated requests from Firestore`);
        } else {
          console.log('⚠️  Firebase Admin not available:', error);
          return NextResponse.json(
            { error: 'Firebase Admin not available' },
            { status: 500 }
          );
        }
      } else {
        console.log('⚠️  Firebase Admin not available');
        return NextResponse.json(
          { error: 'Firebase Admin not available' },
          { status: 500 }
        );
      }
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json(
        { error: 'Failed to fetch vacation requests' },
        { status: 500 }
      );
    }

    // Filter requests that overlap with the current month
    const inRange = all.filter(r => vacationOverlapsMonth(r, startISO, endISO));

    console.log(`📊 Found ${inRange.length} requests overlapping with ${startISO} to ${endISO}`);

    const flat = inRange.map(r => ({
      employee: r.userName || "Unknown",
      company: r.company || "—",
      type: r.type || (r.isHalfDay ? "Half day" : "Full day"),
      status: r.status || "",
      startDate: r.startDate || "",
      endDate: r.endDate || r.startDate || "",
      days: resolveDuration(r)
    }));

    // Filter only approved/validated vacations (exclude rejected)
    const approved = flat.filter(r => {
      const status = (r.status || "").toLowerCase();
      return status === "approved" || status === "validated";
    });
    const totalDays = approved.reduce((s, r) => s + Number(r.days || 0), 0);

    // Format month name for display
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const [year, month] = label.split('-');
    const monthName = monthNames[parseInt(month) - 1];
    const displayLabel = `${monthName} ${year}`;

    // Build email with HTML table
    const subject = `Monthly validated vacations summary – ${displayLabel}`;
    
    // Create HTML table for validated vacations
    let tableRows = '';
    if (approved.length === 0) {
      tableRows = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No validated vacations for this month.</td></tr>';
    } else {
      tableRows = approved.map(r => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.employee || 'Unknown'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.company || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.type || 'Full day'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.startDate || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${r.endDate || r.startDate || '—'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${r.days || 0}</td>
        </tr>
      `).join('');
    }

    const html = `
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
            <p style="margin: 0; opacity: 0.9;">${displayLabel}</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <h2 style="margin: 0 0 12px;">Summary</h2>
              <p style="margin: 4px 0;"><strong>Period:</strong> ${startISO} to ${endISO}</p>
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
              <em>This summary includes only validated/approved vacation requests for ${displayLabel}.</em>
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
    
    const csv = toCSV(approved);
    const filename = `vacations_${label}.csv`;

    // Send email
    const emailResult = await sendEmail(subject, html, csv, filename);

    const recipients = getAccountingEmails();
    console.log(`✅ Monthly summary processed successfully for ${label}`);
    console.log(`   - Validated vacations: ${approved.length} requests (${totalDays.toFixed(1)} days)`);
    console.log(`   - Email sent to: ${recipients.join(', ')}`);
    console.log(`   - Email result: ${emailResult.success ? 'Success' : 'Failed'}`);
    
    if (!emailResult.success) {
      console.error(`❌ Email sending failed:`, emailResult.error);
      const provider = 'provider' in emailResult ? emailResult.provider : undefined;
      const fallback = 'fallback' in emailResult ? emailResult.fallback : undefined;
      console.error(`   Provider: ${provider || fallback || 'unknown'}`);
      
      // Log detailed error information if available
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
      message: emailResult.error || 'Unknown error',
      provider: ('provider' in emailResult ? emailResult.provider : undefined) || ('fallback' in emailResult ? emailResult.fallback : undefined),
      serviceErrors: ('errors' in emailResult && Array.isArray(emailResult.errors)) 
        ? emailResult.errors.map((err: any) => ({ service: err.service, error: err.error }))
        : undefined,
      skippedServices: ('skippedServices' in emailResult && Array.isArray(emailResult.skippedServices))
        ? emailResult.skippedServices
        : undefined,
      configurationMissing: 'configurationMissing' in emailResult ? emailResult.configurationMissing : false,
      configurationHelp: 'configurationHelp' in emailResult ? emailResult.configurationHelp : undefined
    };

    // Return response with detailed email result
    return NextResponse.json({ 
      ok: true, 
      month: label,
      displayLabel: displayLabel,
      validated: approved.length, 
      totalDays: totalDays.toFixed(1),
      dateRange: { start: startISO, end: endISO },
      recipients: recipients,
      emailSent: emailResult.success && !('isTestService' in emailResult && emailResult.isTestService), // Only true if sent via real service
      emailError: emailErrorInfo?.message,
      emailProvider: emailErrorInfo?.provider,
      emailServiceErrors: emailErrorInfo?.serviceErrors,
      emailSkippedServices: emailErrorInfo?.skippedServices,
      emailConfigurationMissing: emailErrorInfo?.configurationMissing,
      emailConfigurationHelp: emailErrorInfo?.configurationHelp,
      isTestService: 'isTestService' in emailResult ? emailResult.isTestService : false,
      emailWarning: 'warning' in emailResult ? emailResult.warning : undefined,
      previewUrl: 'previewUrl' in emailResult ? emailResult.previewUrl : undefined,
      manuallyTriggered: true
    });

  } catch (error) {
    console.error('❌ Error in monthly summary API (POST):', error);
    return NextResponse.json(
      { error: 'Failed to process monthly summary' },
      { status: 500 }
    );
  }
}
