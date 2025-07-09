
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addVacationRequest, getAllVacationRequests } from '@/lib/firebase';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';
import { addVacationToCalendar } from '@/lib/google-calendar';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔧 Loading vacation requests from Firebase...');
    const requests = await getAllVacationRequests();
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('❌ Error loading vacation requests:', error);
    return NextResponse.json(
      { error: 'Failed to load vacation requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, reason, company, type } = body;

    // Validate required fields
    if (!startDate || !endDate || !company || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create vacation request object
    const vacationRequest = {
      userId: session.user.id || session.user.email,
      userEmail: session.user.email, // Add user email
      userName: session.user.name || session.user.email,
      startDate,
      endDate,
      reason: reason || '',
      company,
      type,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    console.log('🔧 Adding vacation request to Firebase...');
    const requestId = await addVacationRequest(vacationRequest);

    // Send email notification
    try {
      const startDate = new Date(vacationRequest.startDate).toLocaleDateString();
      const endDate = new Date(vacationRequest.endDate).toLocaleDateString();
      
      // Get the correct base URL from the request
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      const adminUrl = `${baseUrl}/admin/vacation-requests`;
      
      const emailBody = `
Hello Admins,<br><br>

${vacationRequest.userName} / ${vacationRequest.company} has submitted a vacation request from ${startDate} to ${endDate}.<br><br>

${vacationRequest.reason ? `If comments were added, find them below:<br>${vacationRequest.reason}<br><br>` : ''}

Review this submission by clicking here: <a href="${adminUrl}">${adminUrl}</a>
      `.trim();

      await sendEmailWithFallbacks(['pierre@stars.mc', 'johnny@stars.mc', 'daniel@stars.mc', 'compta@stars.mc'], 'New Vacation Request', emailBody);
      console.log('✅ Email notification sent for new vacation request');
    } catch (emailError) {
      console.error('❌ Error sending email notification:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true, 
      id: requestId,
      message: 'Vacation request submitted successfully' 
    });

  } catch (error) {
    console.error('❌ Error creating vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to create vacation request' },
      { status: 500 }
    );
  }
}

 
