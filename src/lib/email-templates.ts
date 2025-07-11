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
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vacation Request Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D8B11B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .status-approved { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .status-rejected { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .details { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Vacation Request Update</h1>
        <h2>${status}</h2>
    </div>
    
    <div class="content">
        <p>Dear ${userName},</p>
        
        <div class="${statusClass}">
            ${statusMessage}
        </div>
        
        <div class="details">
            <h3>Request Details</h3>
            <p><strong>Employee:</strong> ${userName}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>End Date:</strong> ${endDate}</p>
            <p><strong>Reviewed By:</strong> ${reviewerName}</p>
            <p><strong>Review Date:</strong> ${reviewDate}</p>
            ${commentSection}
        </div>
    </div>
    
    <div class="footer">
        <p>Stars Group - Vacation Management System</p>
    </div>
</body>
</html>`;
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
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vacation Request Update</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #D8B11B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background-color: #f8f9fa; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Vacation Request ${status}</h1>
    </div>
    
    <div class="content">
        <p><strong>${reviewerName}</strong> has ${status.toLowerCase()} a vacation request.</p>
        
        <div class="summary">
            <h3>Request Summary</h3>
            <p><strong>Employee:</strong> ${userName} (${userId})</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Start Date:</strong> ${startDate}</p>
            <p><strong>End Date:</strong> ${endDate}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Reviewed By:</strong> ${reviewerName}</p>
            <p><strong>Review Date:</strong> ${reviewDate}</p>
            ${commentSection}
        </div>
    </div>
    
    <div class="footer">
        <p>Stars Group - Vacation Management System</p>
    </div>
</body>
</html>`;
} 