import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateVacationRequestStatus, getAllVacationRequests, updateVacationRequest } from '@/lib/firebase';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';
import { addVacationToCalendar } from '@/lib/google-calendar';

export async function PATCH(request: Request, context: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = context.params;
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
      const statusMessage = status === 'APPROVED' 
        ? 'Great news! Your vacation request has been approved.' 
        : 'We regret to inform you that your vacation request could not be approved at this time.';
      
      const statusClass = status.toLowerCase();
      const reviewerName = session.user.name || session.user.email;
      const startDate = new Date(updatedRequest.startDate).toLocaleDateString();
      const endDate = new Date(updatedRequest.endDate).toLocaleDateString();
      const reviewDate = new Date().toLocaleDateString();
      const commentSection = comment ? `<p><strong>Comment:</strong> ${comment}</p>` : '';
      
      const employeeEmailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vacation Request ${status}</title>
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
        <p>Dear ${updatedRequest.userName},</p>
        
        <div class="status-${statusClass}">
            ${statusMessage}
        </div>
        
        <div class="details">
            <h3>Request Details</h3>
            <p><strong>Employee:</strong> ${updatedRequest.userName}</p>
            <p><strong>Company:</strong> ${updatedRequest.company}</p>
            <p><strong>Type:</strong> ${updatedRequest.type}</p>
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
            <p><strong>Employee:</strong> ${updatedRequest.userName} (${updatedRequest.userId})</p>
            <p><strong>Company:</strong> ${updatedRequest.company}</p>
            <p><strong>Type:</strong> ${updatedRequest.type}</p>
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