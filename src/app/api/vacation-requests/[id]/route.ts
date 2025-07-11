import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateVacationRequestStatus, getAllVacationRequests, updateVacationRequest } from '@/lib/firebase';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';
import { addVacationToCalendar } from '@/lib/google-calendar';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, comment } = body;

    console.log('🔍 Received request body:', body);
    console.log('🔍 Status from request:', status);
    console.log('🔍 Comment from request:', comment);

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      console.error('❌ Invalid status received:', status);
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    console.log(`🔧 Updating vacation request ${id} status to ${status}...`);

    // Update the vacation request status in Firebase
    await updateVacationRequestStatus(
      id,
      status,
      comment,
      session.user.name || session.user.email,
      session.user.email
    );

    // Get the updated request to send email notifications
    const allRequests = await getAllVacationRequests();
    const updatedRequest = allRequests.find(req => req.id === id);

    if (!updatedRequest) {
      return NextResponse.json(
        { error: 'Vacation request not found' },
        { status: 404 }
      );
    }

    // If approved, add to Google Calendar
    if (status === 'APPROVED') {
      try {
        const eventId = await addVacationToCalendar({
          userName: updatedRequest.userName,
          startDate: updatedRequest.startDate,
          endDate: updatedRequest.endDate,
          type: updatedRequest.type,
          company: updatedRequest.company,
          reason: updatedRequest.reason || undefined,
        });
        // Store event ID in Firestore
        if (eventId) {
          await updateVacationRequest(id, { googleCalendarEventId: eventId });
        }
      } catch (calendarError) {
        console.error('❌ Error adding event to Google Calendar:', calendarError);
        // Don't fail the request if calendar fails
      }
    }

    // Send email notifications
    try {
      console.log('📧 Preparing to send email notifications...');
      console.log('📧 Status for email:', status);
      console.log('📧 Updated request status:', updatedRequest.status);
      
      const emailSubject = `Vacation Request ${status} - ${updatedRequest.userName}`;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stars-vacation-management-dpv42teb7-pierres-projects-bba7ee64.vercel.app';
      
      // Email to employee
      const employeeEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vacation Request ${status}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #D8B11B 0%, #21254B 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 10px;
        }
        .status-approved {
            background-color: #10b981;
            color: white;
        }
        .status-rejected {
            background-color: #ef4444;
            color: white;
        }
        .content {
            padding: 30px;
        }
        .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #374151;
        }
        .status-message {
            font-size: 16px;
            margin-bottom: 25px;
            padding: 15px;
            border-radius: 8px;
            background-color: ${status === 'APPROVED' ? '#f0fdf4' : '#fef2f2'};
            border-left: 4px solid ${status === 'APPROVED' ? '#10b981' : '#ef4444'};
        }
        .details-section {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-section h3 {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
            font-weight: 600;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-row:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
        }
        .detail-value {
            color: #1f2937;
            text-align: right;
        }
        .admin-comment {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .admin-comment h3 {
            margin: 0 0 10px 0;
            color: #92400e;
            font-size: 16px;
        }
        .admin-comment p {
            margin: 0;
            color: #78350f;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .action-button {
            display: inline-block;
            background-color: #D8B11B;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
            transition: background-color 0.2s;
        }
        .action-button:hover {
            background-color: #c19b1a;
        }
        .company-info {
            font-size: 14px;
            color: #6b7280;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Vacation Request Update</h1>
            <div class="status-badge status-${status.toLowerCase()}">${status}</div>
        </div>
        
        <div class="content">
            <div class="greeting">Dear ${updatedRequest.userName},</div>
            
            <div class="status-message">
                ${status === 'APPROVED' 
                    ? '🎉 Great news! Your vacation request has been approved. You can now plan your time off with confidence.<br>(Approval subject to a sufficient balance of available vacation days.)' 
                    : 'We regret to inform you that your vacation request could not be approved at this time.'
                }
            </div>
            
            <div class="details-section">
                <h3>📋 Request Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Employee:</span>
                    <span class="detail-value">${updatedRequest.userName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Company:</span>
                    <span class="detail-value">${updatedRequest.company}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Type:</span>
                    <span class="detail-value">${updatedRequest.type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Start Date:</span>
                    <span class="detail-value">${new Date(updatedRequest.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">End Date:</span>
                    <span class="detail-value">${new Date(updatedRequest.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Reviewed By:</span>
                    <span class="detail-value">${session.user.name || session.user.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Review Date:</span>
                    <span class="detail-value">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            ${comment ? `
            <div class="admin-comment">
                <h3>💬 Additional Comments</h3>
                <p>${comment}</p>
            </div>
            ` : ''}

            ${status === 'APPROVED' ? `
            <div style="background-color: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">✅ Next Steps</h3>
                <p style="margin: 0; color: #047857;">Your vacation has been automatically added to the company calendar. Please ensure your team is aware of your absence and that all pending tasks are properly delegated.</p>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <a href="${baseUrl}/vacation-request" class="action-button">View My Requests</a>
            <div class="company-info">
                <strong>Stars Group</strong><br>
                Vacation Management System<br>
                ${baseUrl}
            </div>
        </div>
    </div>
</body>
</html>
      `.trim();

      await sendEmailWithFallbacks([updatedRequest.userEmail], emailSubject, employeeEmailBody);
      console.log(`✅ Status email sent to employee: ${updatedRequest.userEmail}`);

      // Email to admin team
      const adminEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vacation Request ${status}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #D8B11B 0%, #21254B 100%);
            color: white;
            padding: 25px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 25px;
        }
        .summary {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .summary h3 {
            margin: 0 0 15px 0;
            color: #1f2937;
            font-size: 18px;
        }
        .detail-item {
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .detail-item:last-child {
            border-bottom: none;
        }
        .detail-label {
            font-weight: 600;
            color: #6b7280;
            display: inline-block;
            width: 120px;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 25px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .action-button {
            display: inline-block;
            background-color: #D8B11B;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Vacation Request ${status}</h1>
        </div>
        
        <div class="content">
            <p><strong>${session.user.name || session.user.email}</strong> has ${status.toLowerCase()} a vacation request.</p>
            
            <div class="summary">
                <h3>📋 Request Summary</h3>
                <div class="detail-item">
                    <span class="detail-label">Employee:</span>
                    <span>${updatedRequest.userName} (${updatedRequest.userId})</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Company:</span>
                    <span>${updatedRequest.company}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Type:</span>
                    <span>${updatedRequest.type}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Start Date:</span>
                    <span>${new Date(updatedRequest.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">End Date:</span>
                    <span>${new Date(updatedRequest.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Status:</span>
                    <span><strong>${status}</strong></span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Reviewed By:</span>
                    <span>${session.user.name || session.user.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Review Date:</span>
                    <span>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                ${comment ? `
                <div class="detail-item">
                    <span class="detail-label">Comment:</span>
                    <span>${comment}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="footer">
            <a href="${baseUrl}/admin/vacation-requests" class="action-button">View All Requests</a>
        </div>
    </div>
</body>
</html>
      `.trim();

      console.log('📧 Sending admin notification email...');
      console.log('📧 Recipients:', ['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc']);
      console.log('📧 Subject:', emailSubject);
      
      const adminEmailResult = await sendEmailWithFallbacks(['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'], emailSubject, adminEmailBody);
      console.log('✅ Status email sent to admin team');
      console.log('📧 Admin email result:', adminEmailResult);

      console.log(`✅ Status emails sent for request ${id}: ${status}`);

    } catch (emailError) {
      console.error('❌ Error sending status emails:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      message: `Vacation request ${status.toLowerCase()} successfully`,
      request: updatedRequest
    });

  } catch (error) {
    console.error('❌ Error updating vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to update vacation request' },
      { status: 500 }
    );
  }
} 