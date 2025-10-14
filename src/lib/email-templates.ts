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

  const subject = `New Vacation request from ${data.userEmail} - ${data.company || 'Unknown'}`;
  
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
          <span class="info-value">${data.company || 'Unknown'}</span>
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
Company: ${data.company || 'Unknown'}
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

/**
 * Generate decision email for the requester (approved/denied)
 */
export function generateDecisionEmail(data: VacationRequestData & { 
  decision: 'approved' | 'denied'; 
  adminComment?: string; 
  reviewedBy?: string; 
}): { subject: string; html: string; text: string } {
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

  const isApproved = data.decision === 'approved';
  const subject = `Vacation Request ${isApproved ? 'Approved' : 'Denied'} #${data.id}`;
  
  const headerColor = isApproved ? '#10b981' : '#ef4444';
  const headerIcon = isApproved ? '✅' : '❌';
  const headerText = isApproved ? 'Request Approved' : 'Request Denied';
  const statusColor = isApproved ? '#f0fdf4' : '#fef2f2';
  const borderColor = isApproved ? '#bbf7d0' : '#fecaca';
  const textColor = isApproved ? '#166534' : '#dc2626';
  const valueColor = isApproved ? '#15803d' : '#dc2626';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vacation Request Decision</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
    .header { background: ${headerColor}; color: white; padding: 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .request-info { background: ${statusColor}; border: 1px solid ${borderColor}; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid ${borderColor}; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: ${textColor}; }
    .info-value { color: ${valueColor}; }
    .status-badge { display: inline-block; background: ${isApproved ? '#10b981' : '#ef4444'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .half-day { background: #dbeafe; color: #1e40af; }
    .admin-comment { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${headerIcon} ${headerText}</h1>
    </div>
    
    <div class="content">
      <p>Hello ${data.userName},</p>
      
      <p>Your vacation request has been reviewed and ${isApproved ? 'approved' : 'denied'}.</p>
      
      <div class="request-info">
        <div class="info-row">
          <span class="info-label">Request ID:</span>
          <span class="info-value">#${data.id}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status:</span>
          <span class="info-value"><span class="status-badge">${isApproved ? 'Approved' : 'Denied'}</span></span>
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
        ${data.reviewedBy ? `
        <div class="info-row">
          <span class="info-label">Reviewed by:</span>
          <span class="info-value">${data.reviewedBy}</span>
        </div>
        ` : ''}
      </div>
      
      ${data.adminComment ? `
      <div class="admin-comment">
        <h3 style="margin-top: 0; color: #4a5568;">Admin Comment:</h3>
        <p style="margin-bottom: 0; color: #2d3748;">${data.adminComment}</p>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        ${isApproved 
          ? 'Your vacation request has been approved. Please ensure you have completed any necessary handover tasks before your vacation begins.'
          : 'If you have any questions about this decision, please contact your manager or HR department.'
        }
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Vacation Request ${isApproved ? 'Approved' : 'Denied'} #${data.id}

Hello ${data.userName},

Your vacation request has been reviewed and ${isApproved ? 'approved' : 'denied'}.

Request Details:
- Request ID: #${data.id}
- Status: ${isApproved ? 'Approved' : 'Denied'}
- Start Date: ${formattedStartDate}
- End Date: ${formattedEndDate}
- Duration: ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}${data.isHalfDay ? ` (Half Day - ${data.halfDayType})` : ''}
- Reason: ${data.reason}
${data.reviewedBy ? `- Reviewed by: ${data.reviewedBy}` : ''}

${data.adminComment ? `Admin Comment: ${data.adminComment}` : ''}

${isApproved 
  ? 'Your vacation request has been approved. Please ensure you have completed any necessary handover tasks before your vacation begins.'
  : 'If you have any questions about this decision, please contact your manager or HR department.'
}

---
Stars Vacation Management System
`;

  return { subject, html, text };
}
/**
 * Generate admin-to-admin notification email when a request is reviewed
 */
export function generateAdminReviewNotificationEmail(data: AdminReviewNotificationData): { subject: string; html: string; text: string } {
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
  const formattedReviewedAt = new Date(data.reviewedAt).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isApproved = data.decision === 'approved';
  const subject = `Vacation Request ${isApproved ? 'Approved' : 'Denied'} by ${data.reviewedBy} - #${data.id}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vacation Request ${isApproved ? 'Approved' : 'Denied'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, ${isApproved ? '#10b981' : '#ef4444'}, ${isApproved ? '#059669' : '#dc2626'}); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
    .header p { margin: 8px 0 0; opacity: 0.9; font-size: 16px; }
    .content { padding: 30px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 14px; margin-bottom: 20px; }
    .status-approved { background-color: #d1fae5; color: #065f46; }
    .status-denied { background-color: #fee2e2; color: #991b1b; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-item { background-color: #f8fafc; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
    .info-label { font-weight: 600; color: #4a5568; font-size: 14px; margin-bottom: 5px; }
    .info-value { color: #2d3748; font-size: 16px; }
    .admin-comment { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin: 20px 0; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e2e8f0; }
    .reviewer-info { background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin: 20px 0; }
    @media (max-width: 600px) {
      .info-grid { grid-template-columns: 1fr; }
      .content { padding: 20px; }
      .header { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Vacation Request ${isApproved ? 'Approved' : 'Denied'}</h1>
      <p>Request #${data.id} has been reviewed by another administrator</p>
    </div>
    
    <div class="content">
      <div class="status-badge ${isApproved ? 'status-approved' : 'status-denied'}">
        ${isApproved ? '✅ Approved' : '❌ Denied'}
      </div>
      
      <div class="info-grid">
        <div class="info-item">
          <div class="info-label">Employee</div>
          <div class="info-value">${data.userName}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${data.userEmail}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Company</div>
          <div class="info-value">${data.company || 'Unknown'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Type</div>
          <div class="info-value">${data.type}${data.isHalfDay ? ` (Half Day - ${data.halfDayType})` : ''}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Start Date</div>
          <div class="info-value">${formattedStartDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">End Date</div>
          <div class="info-value">${formattedEndDate}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Duration</div>
          <div class="info-value">${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Reason</div>
          <div class="info-value">${data.reason || 'No reason provided'}</div>
        </div>
      </div>
      
      <div class="reviewer-info">
        <h3 style="margin-top: 0; color: #1e40af;">Review Details</h3>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Reviewed by</div>
            <div class="info-value">${data.reviewedBy}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Reviewer Email</div>
            <div class="info-value">${data.reviewerEmail}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Reviewed at</div>
            <div class="info-value">${formattedReviewedAt}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Decision</div>
            <div class="info-value">${isApproved ? 'Approved' : 'Denied'}</div>
          </div>
        </div>
      </div>
      
      ${data.adminComment ? `
      <div class="admin-comment">
        <h3 style="margin-top: 0; color: #4a5568;">Admin Comment:</h3>
        <p style="margin-bottom: 0; color: #2d3748;">${data.adminComment}</p>
      </div>
      ` : ''}
      
      <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
        This vacation request has been ${isApproved ? 'approved' : 'denied'} by ${data.reviewedBy}. 
        ${isApproved 
          ? 'The employee has been notified of the approval and the vacation has been added to the calendar.'
          : 'The employee has been notified of the denial.'
        }
      </p>
    </div>
    
    <div class="footer">
      <p>Stars Vacation Management System</p>
      <p>View request details: <a href="${adminUrl}">${adminUrl}</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Vacation Request ${isApproved ? 'Approved' : 'Denied'} by ${data.reviewedBy} - #${data.id}

A vacation request has been reviewed and ${isApproved ? 'approved' : 'denied'} by another administrator.

Request Details:
- Request ID: #${data.id}
- Employee: ${data.userName} (${data.userEmail})
- Company: ${data.company || 'Unknown'}
- Type: ${data.type}${data.isHalfDay ? ` (Half Day - ${data.halfDayType})` : ''}
- Start Date: ${formattedStartDate}
- End Date: ${formattedEndDate}
- Duration: ${data.durationDays} day${data.durationDays !== 1 ? 's' : ''}
- Reason: ${data.reason || 'No reason provided'}

Review Details:
- Reviewed by: ${data.reviewedBy}
- Reviewer Email: ${data.reviewerEmail}
- Reviewed at: ${formattedReviewedAt}
- Decision: ${isApproved ? 'Approved' : 'Denied'}

${data.adminComment ? `Admin Comment: ${data.adminComment}` : ''}

This vacation request has been ${isApproved ? 'approved' : 'denied'} by ${data.reviewedBy}. 
${isApproved 
  ? 'The employee has been notified of the approval and the vacation has been added to the calendar.'
  : 'The employee has been notified of the denial.'
}

View request details: ${adminUrl}

---
Stars Vacation Management System
`;

  return { subject, html, text };
}
