import { nonEmpty } from '@/lib/strings';

export function getEmployeeEmailTemplate(
  status: string,
  userName: string,
  statusMessage: string,
  statusClass: string,
  company: string,
  type: string,
  startDate: string,
  endDate: string,
  reviewerName: string,
  reviewDate: string,
  commentSection: string
): string {
  // Safe fallbacks for critical fields
  const safeUserName = nonEmpty(userName, 'Unknown Employee');
  const safeCompany = nonEmpty(company, '—');
  const safeType = nonEmpty(type, 'Vacation');
  const safeStartDate = nonEmpty(startDate, '—');
  const safeEndDate = nonEmpty(endDate, safeStartDate);
  const safeReviewerName = nonEmpty(reviewerName, 'Admin');
  const safeReviewDate = nonEmpty(reviewDate, '—');
  
  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Vacation Request Update</title>' +
        '<style>' +
            'body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }' +
            '.header { background: #D8B11B; color: white; padding: 20px; text-align: center; }' +
            '.content { padding: 20px; }' +
            '.status-approved { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }' +
            '.status-rejected { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }' +
            '.details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }' +
            '.footer { background-color: #f8f9fa; padding: 20px; text-align: center; }' +
        '</style>' +
    '</head>' +
    '<body>' +
        '<div class="header">' +
            '<h1>Vacation Request Update</h1>' +
            '<h2>' + status + '</h2>' +
        '</div>' +
        '<div class="content">' +
            '<p>Dear ' + safeUserName + ',</p>' +
            '<div class="' + statusClass + '">' +
                statusMessage +
            '</div>' +
            '<div class="details">' +
                '<h3>Request Details</h3>' +
                '<p><strong>Employee:</strong> ' + safeUserName + '</p>' +
                '<p><strong>Company:</strong> ' + safeCompany + '</p>' +
                '<p><strong>Type:</strong> ' + safeType + '</p>' +
                '<p><strong>Start Date:</strong> ' + safeStartDate + '</p>' +
                '<p><strong>End Date:</strong> ' + safeEndDate + '</p>' +
                '<p><strong>Reviewed By:</strong> ' + safeReviewerName + '</p>' +
                '<p><strong>Review Date:</strong> ' + safeReviewDate + '</p>' +
                commentSection +
            '</div>' +
        '</div>' +
        '<div class="footer">' +
            '<p>Stars Group - Vacation Management System</p>' +
        '</div>' +
    '</body>' +
    '</html>';
}

export function getAdminEmailTemplate(
  status: string,
  reviewerName: string,
  userName: string,
  userId: string,
  company: string,
  type: string,
  startDate: string,
  endDate: string,
  reviewDate: string,
  commentSection: string
): string {
  // Safe fallbacks for critical fields
  const safeReviewerName = nonEmpty(reviewerName, 'Admin');
  const safeUserName = nonEmpty(userName, 'Unknown Employee');
  const safeUserId = nonEmpty(userId, '—');
  const safeCompany = nonEmpty(company, '—');
  const safeType = nonEmpty(type, 'Vacation');
  const safeStartDate = nonEmpty(startDate, '—');
  const safeEndDate = nonEmpty(endDate, safeStartDate);
  const safeReviewDate = nonEmpty(reviewDate, '—');
  
  return '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
        '<title>Vacation Request Update</title>' +
        '<style>' +
            'body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }' +
            '.header { background: #D8B11B; color: white; padding: 20px; text-align: center; }' +
            '.content { padding: 20px; }' +
            '.summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }' +
            '.footer { background-color: #f8f9fa; padding: 20px; text-align: center; }' +
        '</style>' +
    '</head>' +
    '<body>' +
        '<div class="header">' +
            '<h1>Vacation Request ' + status + '</h1>' +
        '</div>' +
        '<div class="content">' +
            '<p><strong>' + safeReviewerName + '</strong> has ' + status.toLowerCase() + ' a vacation request.</p>' +
            '<div class="summary">' +
                '<h3>Request Summary</h3>' +
                '<p><strong>Employee:</strong> ' + safeUserName + ' (' + safeUserId + ')</p>' +
                '<p><strong>Company:</strong> ' + safeCompany + '</p>' +
                '<p><strong>Type:</strong> ' + safeType + '</p>' +
                '<p><strong>Start Date:</strong> ' + safeStartDate + '</p>' +
                '<p><strong>End Date:</strong> ' + safeEndDate + '</p>' +
                '<p><strong>Status:</strong> ' + status + '</p>' +
                '<p><strong>Reviewed By:</strong> ' + safeReviewerName + '</p>' +
                '<p><strong>Review Date:</strong> ' + safeReviewDate + '</p>' +
                commentSection +
            '</div>' +
        '</div>' +
        '<div class="footer">' +
            '<p>Stars Group - Vacation Management System</p>' +
        '</div>' +
    '</body>' +
    '</html>';
}

export function adminVacationSubject({
  hasConflicts,
  userName,
}: {
  hasConflicts: boolean;
  userName: string;
}) {
  const safeUserName = nonEmpty(userName, 'Unknown Employee');
  const prefix = hasConflicts ? "⚠️ Possible conflict — " : "";
  return `${prefix}New Vacation Request — ${safeUserName}`;
}

export function adminVacationText({
  userName,
  companyName,
  startDate,
  endDate,
  isHalfDay,
  halfDayType,
  hasConflicts,
}: {
  userName: string;
  companyName: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDayType?: "morning" | "afternoon" | null;
  hasConflicts: boolean;
}): string {
  // Safe fallbacks for critical fields
  const safeUserName = nonEmpty(userName, 'Unknown Employee');
  const safeCompanyName = nonEmpty(companyName, '—');
  const safeStartDate = nonEmpty(startDate, '—');
  const safeEndDate = nonEmpty(endDate, safeStartDate);
  
  const dateRange = safeStartDate === safeEndDate ? safeStartDate : `${safeStartDate} to ${safeEndDate}`;
  const halfDaySuffix = isHalfDay ? ` (Half-day, ${halfDayType})` : "";
  const conflictWarning = hasConflicts ? "\n\nCheck for conflicts before reviewing the request." : "";
  
  return `Hello Admin,

${isHalfDay ? 'Half-day' : 'Full-day'} vacation request from ${safeUserName} from ${safeCompanyName}.
Dates required ${dateRange}${halfDaySuffix}

Check for conflicts before reviewing the request.

Thank you!

The vacation system`;
}

export function adminVacationHtml({
  userName,
  companyName,
  startDate,
  endDate,
  isHalfDay,
  halfDayType,
  hasConflicts,
  reviewUrl,
}: {
  userName: string;
  companyName: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDayType?: "morning" | "afternoon" | null;
  hasConflicts: boolean;
  reviewUrl: string;
}): string {
  // Safe fallbacks for critical fields
  const safeUserName = nonEmpty(userName, 'Unknown Employee');
  const safeCompanyName = nonEmpty(companyName, '—');
  const safeStartDate = nonEmpty(startDate, '—');
  const safeEndDate = nonEmpty(endDate, safeStartDate);
  
  const dateRange = safeStartDate === safeEndDate ? safeStartDate : `${safeStartDate} to ${safeEndDate}`;
  const halfDaySuffix = isHalfDay ? ` (Half-day, ${halfDayType})` : "";
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Vacation Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D8B11B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .conflict { color: #d63384; font-weight: bold; }
        .button { display: inline-block; padding: 10px 20px; background: #D8B11B; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>New Vacation Request</h1>
    </div>
    <div class="content">
        <p>Hello Admin,</p>
        
        <div class="details">
            <p><strong>${isHalfDay ? 'Half-day' : 'Full-day'} vacation request from ${safeUserName} from ${safeCompanyName}.</strong></p>
            <p><strong>Dates required ${dateRange}${halfDaySuffix}</strong></p>
        </div>
        
        <p>Check for conflicts before reviewing the request.</p>
        
        <a href="${reviewUrl}" class="button">Review Request</a>
        
        <p>Thank you!</p>
        <p><strong>The vacation system</strong></p>
    </div>
    <div class="footer">
        <p>Stars Group - Vacation Management System</p>
    </div>
</body>
</html>`;
} 