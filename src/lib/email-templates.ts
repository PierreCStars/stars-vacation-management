/**
 * HTML email templates for vacation request notifications
 */

import { adminVacationRequestUrl } from './urls';

export interface VacationRequestData {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  company: string;
  type: string;
  isHalfDay: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays: number;
  createdAt: string;
  locale?: string;
}

/**
 * Generate admin notification email for new vacation request
 */
export function generateAdminNotificationEmail(data: VacationRequestData): { subject: string; html: string; text: string } {
  const adminUrl = adminVacationRequestUrl(data.id, data.locale || 'en');
  const formattedStartDate = new Date(data.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedEndDate = new Date(data.endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `New Vacation Request #${data.id} - ${data.userName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Vacation Request</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .request-info { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #4a5568; }
    .info-value { color: #2d3748; }
    .cta-button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #1d4ed8; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
    .badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .half-day { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏖️ New Vacation Request</h1>
    </div>
    
    <div class="content">
      <p>A new vacation request has been submitted and requires your review.</p>
      
      <div class="request-info">
        <div class="info-row">
          <span class="info-label">Request ID:</span>
          <span class="info-value">#${data.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Employee:</span>
          <span class="info-value">${data.userName} (${data.userEmail})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company:</span>
          <span class="info-value">${data.company}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${data.type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Start Date:</span>
          <span class="info-value">${formattedStartDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">End Date:</span>
          <span class="info-value">${formattedEndDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">
            ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}
            ${data.isHalfDay ? `<span class="badge half-day">Half Day (${data.halfDayType})</span>` : ''}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason:</span>
          <span class="info-value">${data.reason}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Submitted:</span>
          <span class="info-value">${new Date(data.createdAt).toLocaleString('en-US')}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${adminUrl}" class="cta-button">Review Request</a>
      </div>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This request is currently pending approval. Please review the details and take appropriate action.
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System</p>
      <p>If you cannot click the button above, copy and paste this link: <a href="${adminUrl}">${adminUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `
New Vacation Request #${data.id}

Employee: ${data.userName} (${data.userEmail})
Company: ${data.company}
Type: ${data.type}
Start Date: ${formattedStartDate}
End Date: ${formattedEndDate}
Duration: ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}${data.isHalfDay ? ` (Half Day - ${data.halfDayType})` : ''}
Reason: ${data.reason}
Submitted: ${new Date(data.createdAt).toLocaleString('en-US')}

Review this request: ${adminUrl}

This request is currently pending approval. Please review the details and take appropriate action.

---
Stars Vacation Management System
`;

  return { subject, html, text };
}

/**
 * Generate confirmation email for the requester
 */
export function generateRequestConfirmationEmail(data: VacationRequestData): { subject: string; html: string; text: string } {
  const formattedStartDate = new Date(data.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedEndDate = new Date(data.endDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const subject = `Vacation Request Submitted #${data.id}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vacation Request Confirmation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: #10b981; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .request-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #bbf7d0; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #166534; }
    .info-value { color: #15803d; }
    .status-badge { display: inline-block; background: #fbbf24; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .half-day { background: #dbeafe; color: #1e40af; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Request Submitted</h1>
    </div>
    
    <div class="content">
      <p>Hello ${data.userName},</p>
      
      <p>Your vacation request has been successfully submitted and is now under review.</p>
      
      <div class="request-info">
        <div class="info-row">
          <span class="info-label">Request ID:</span>
          <span class="info-value">#${data.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value"><span class="status-badge">Pending Review</span></span>
        </div>
        <div class="info-row">
          <span class="info-label">Start Date:</span>
          <span class="info-value">${formattedStartDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">End Date:</span>
          <span class="info-value">${formattedEndDate}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duration:</span>
          <span class="info-value">
            ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}
            ${data.isHalfDay ? `<span class="status-badge half-day">Half Day (${data.halfDayType})</span>` : ''}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">Reason:</span>
          <span class="info-value">${data.reason}</span>
        </div>
      </div>
      
      <p>You will receive an email notification once your request has been reviewed and a decision has been made.</p>
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        If you have any questions about your request, please contact your manager or HR department.
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Vacation Request Confirmation #${data.id}

Hello ${data.userName},

Your vacation request has been successfully submitted and is now under review.

Request Details:
- Request ID: #${data.id}
- Status: Pending Review
- Start Date: ${formattedStartDate}
- End Date: ${formattedEndDate}
- Duration: ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}${data.isHalfDay ? ` (Half Day - ${data.halfDayType})` : ''}
- Reason: ${data.reason}

You will receive an email notification once your request has been reviewed and a decision has been made.

If you have any questions about your request, please contact your manager or HR department.

---
Stars Vacation Management System
`;

  return { subject, html, text };
}