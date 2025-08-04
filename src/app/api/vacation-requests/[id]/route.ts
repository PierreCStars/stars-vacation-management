import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateVacationRequestStatus, getAllVacationRequests, updateVacationRequest } from '@/lib/firebase';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';
import { addVacationToCalendar } from '@/lib/google-calendar';
import { getEmployeeEmailTemplate, getAdminEmailTemplate } from '@/lib/email-templates';

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
    const updatedRequest = allRequests.find((req: any) => req.id === id);

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
      
      const emailSubject = 'Vacation Request ' + status + ' - ' + updatedRequest.userName;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      
      // Prepare variables for email templates
      const statusMessage = status === 'APPROVED' 
        ? 'Great news! Your vacation request has been approved.' 
        : 'We regret to inform you that your vacation request could not be approved at this time.';
      
      const statusClass = status.toLowerCase();
      const reviewerName = session.user.name || session.user.email;
      const startDate = new Date(updatedRequest.startDate).toLocaleDateString();
      const endDate = new Date(updatedRequest.endDate).toLocaleDateString();
      const reviewDate = new Date().toLocaleDateString();
      const commentSection = comment ? '<p><strong>Comment:</strong> ' + comment + '</p>' : '';
      
      // Generate email templates using the template functions
      const employeeEmailBody = getEmployeeEmailTemplate(
        status,
        updatedRequest.userName,
        statusMessage,
        statusClass,
        updatedRequest.company,
        updatedRequest.type,
        startDate,
        endDate,
        reviewerName,
        reviewDate,
        commentSection
      );

      await sendEmailWithFallbacks([updatedRequest.userEmail], emailSubject, employeeEmailBody);
      console.log(`✅ Status email sent to employee: ${updatedRequest.userEmail}`);

      // Generate admin email template
      const adminEmailBody = getAdminEmailTemplate(
        status,
        reviewerName,
        updatedRequest.userName,
        updatedRequest.userId,
        updatedRequest.company,
        updatedRequest.type,
        startDate,
        endDate,
        reviewDate,
        commentSection
      );

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