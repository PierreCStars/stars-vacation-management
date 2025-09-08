import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { 
  getReviewedRequestsForMonth, 
  generateCSVContent, 
  getMonthName,
  isLastDayOfMonth 
} from '@/lib/csv-export';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'];
    if (!adminEmails.includes(session.user.email)) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    // Get the month to export (default to current month if not specified)
    const body = await request.json();
    const targetYear = body?.year || new Date().getFullYear();
    const targetMonth = body?.month || new Date().getMonth() + 1;

    console.log(`📊 Starting monthly CSV export for ${targetYear}-${targetMonth.toString().padStart(2, '0')}...`);

    // Get reviewed requests for the specified month
    const reviewedRequests = await getReviewedRequestsForMonth(targetYear, targetMonth);

    if (reviewedRequests.length === 0) {
      console.log('📋 No reviewed requests found for the specified month');
      return NextResponse.json({ 
        success: true, 
        message: 'No reviewed requests found for the specified month',
        month: getMonthName(targetMonth),
        year: targetYear,
        count: 0
      });
    }

    // Generate CSV content
    const csvContent = generateCSVContent(reviewedRequests);
    const monthName = getMonthName(targetMonth);
    const fileName = `${monthName}_${targetYear}_vacations.csv`;

    // Create email body
    const emailBody = `
<h2>Monthly Vacation Report - ${monthName} ${targetYear}</h2>

<p>Hello,</p>

<p>Please find attached the monthly vacation report for <strong>${monthName} ${targetYear}</strong>.</p>

<h3>Report Summary:</h3>
<ul>
  <li><strong>Month:</strong> ${monthName} ${targetYear}</li>
  <li><strong>Total Reviewed Requests:</strong> ${reviewedRequests.length}</li>
  <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
</ul>

<h3>Request Breakdown:</h3>
<ul>
  <li><strong>Approved:</strong> ${reviewedRequests.filter(r => r.status === 'APPROVED').length}</li>
  <li><strong>Rejected:</strong> ${reviewedRequests.filter(r => r.status === 'REJECTED').length}</li>
  <li><strong>Other:</strong> ${reviewedRequests.filter(r => r.status !== 'APPROVED' && r.status !== 'REJECTED').length}</li>
</ul>

<p>The CSV file contains detailed information about each vacation request including employee details, dates, reasons, and admin comments.</p>

<p>Best regards,<br>
Vacation Management System</p>
    `.trim();

    // Send email with CSV attachment
    const emailSubject = `${monthName} Vacations`;
    
    // For now, we'll include the CSV content in the email body
    // In a production environment, you might want to use a proper email service that supports attachments
    const emailWithCSV = `${emailBody}

<hr>
<h3>CSV Data:</h3>
<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${csvContent}
</pre>`;

    const result = await sendEmailWithFallbacks(['compta@stars.mc'], emailSubject, emailWithCSV);

    if (result.success) {
      console.log(`✅ Monthly CSV export sent successfully to compta@stars.mc`);
      console.log(`📧 Subject: ${emailSubject}`);
      console.log(`📊 Records: ${reviewedRequests.length}`);
    } else {
      console.error('❌ Failed to send monthly CSV export:', result.error);
    }

    return NextResponse.json({
      success: true,
      message: `Monthly CSV export completed for ${monthName} ${targetYear}`,
      month: monthName,
      year: targetYear,
      count: reviewedRequests.length,
      emailResult: result,
      fileName: fileName
    });

  } catch (error) {
    console.error('❌ Error in monthly CSV export:', error);
    return NextResponse.json(
      { error: 'Failed to generate monthly CSV export' },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest) {
  try {
    // Check if it's the last day of the month
    if (!isLastDayOfMonth()) {
      return NextResponse.json({
        success: true,
        message: 'Not the last day of the month. CSV export will run automatically on the last day.',
        isLastDay: false,
        nextCheck: 'Tomorrow'
      });
    }

    // Get current month and year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    console.log(`📊 Auto-triggering monthly CSV export for ${currentYear}-${currentMonth.toString().padStart(2, '0')}...`);

    // Get reviewed requests for the current month
    const reviewedRequests = await getReviewedRequestsForMonth(currentYear, currentMonth);

    if (reviewedRequests.length === 0) {
      console.log('📋 No reviewed requests found for automatic export');
      return NextResponse.json({
        success: true,
        message: 'No reviewed requests found for automatic export',
        isLastDay: true,
        month: getMonthName(currentMonth),
        year: currentYear,
        count: 0
      });
    }

    // Generate CSV content
    const csvContent = generateCSVContent(reviewedRequests);
    const monthName = getMonthName(currentMonth);
    const emailSubject = `${monthName} Vacations`;

    // Create email body
    const emailBody = `
<h2>Monthly Vacation Report - ${monthName} ${currentYear}</h2>

<p>Hello,</p>

<p>This is your automated monthly vacation report for <strong>${monthName} ${currentYear}</strong>.</p>

<h3>Report Summary:</h3>
<ul>
  <li><strong>Month:</strong> ${monthName} ${currentYear}</li>
  <li><strong>Total Reviewed Requests:</strong> ${reviewedRequests.length}</li>
  <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
</ul>

<h3>Request Breakdown:</h3>
<ul>
  <li><strong>Approved:</strong> ${reviewedRequests.filter(r => r.status === 'APPROVED').length}</li>
  <li><strong>Rejected:</strong> ${reviewedRequests.filter(r => r.status === 'REJECTED').length}</li>
  <li><strong>Other:</strong> ${reviewedRequests.filter(r => r.status !== 'APPROVED' && r.status !== 'REJECTED').length}</li>
</ul>

<p>The CSV data is included below for your records.</p>

<p>Best regards,<br>
Vacation Management System</p>

<hr>
<h3>CSV Data:</h3>
<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${csvContent}
</pre>`;

    // Send email
    const result = await sendEmailWithFallbacks(['compta@stars.mc'], emailSubject, emailBody);

    if (result.success) {
      console.log(`✅ Automatic monthly CSV export sent successfully to compta@stars.mc`);
      console.log(`📧 Subject: ${emailSubject}`);
      console.log(`📊 Records: ${reviewedRequests.length}`);
    } else {
      console.error('❌ Failed to send automatic monthly CSV export:', result.error);
    }

    return NextResponse.json({
      success: true,
      message: `Automatic monthly CSV export completed for ${monthName} ${currentYear}`,
      isLastDay: true,
      month: monthName,
      year: currentYear,
      count: reviewedRequests.length,
      emailResult: result
    });

  } catch (error) {
    console.error('❌ Error in automatic monthly CSV export:', error);
    return NextResponse.json(
      { error: 'Failed to generate automatic monthly CSV export' },
      { status: 500 }
    );
  }
} 