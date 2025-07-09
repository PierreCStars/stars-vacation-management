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
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      // Email to employee
      const employeeEmailBody = `
<h2>Vacation Request ${status}</h2>

<p>Hello ${updatedRequest.userName},</p>

<p>Your vacation request has been <strong>${status.toLowerCase()}</strong>.</p>

<h3>Request Details:</h3>
<ul>
  <li><strong>Employee:</strong> ${updatedRequest.userName}</li>
  <li><strong>Company:</strong> ${updatedRequest.company}</li>
  <li><strong>Type:</strong> ${updatedRequest.type}</li>
  <li><strong>Start Date:</strong> ${new Date(updatedRequest.startDate).toLocaleDateString()}</li>
  <li><strong>End Date:</strong> ${new Date(updatedRequest.endDate).toLocaleDateString()}</li>
  <li><strong>Status:</strong> ${status}</li>
  <li><strong>Reviewed By:</strong> ${session.user.name || session.user.email}</li>
  <li><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</li>
</ul>

${comment ? `<h3>Admin Comment:</h3><p>${comment}</p>` : ''}

<p>View your request at: <a href="${baseUrl}/vacation-request">${baseUrl}/vacation-request</a></p>
      `.trim();

      await sendEmailWithFallbacks([updatedRequest.userEmail], emailSubject, employeeEmailBody);
      console.log(`✅ Status email sent to employee: ${updatedRequest.userEmail}`);

      // Email to admin team
      const adminEmailBody = `
Vacation request ${status.toLowerCase()} by ${session.user.name || session.user.email}.

Details:
- Employee: ${updatedRequest.userName} (${updatedRequest.userId})
- Company: ${updatedRequest.company}
- Type: ${updatedRequest.type}
- Start Date: ${new Date(updatedRequest.startDate).toLocaleDateString()}
- End Date: ${new Date(updatedRequest.endDate).toLocaleDateString()}
- Status: ${status}
- Reviewed By: ${session.user.name || session.user.email}
- Review Date: ${new Date().toLocaleDateString()}
${comment ? `- Comment: ${comment}` : ''}

View all requests at: ${baseUrl}/admin/vacation-requests
      `.trim();

      await sendEmailWithFallbacks(['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'], emailSubject, adminEmailBody);
      console.log('✅ Status email sent to admin team');

      console.log(`✅ Status emails sent via Gmail SMTP for request ${id}: ${status}`);

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