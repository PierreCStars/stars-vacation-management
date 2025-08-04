
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
    
    // If it's an authentication error, return 401
    if (error instanceof Error && (error.message?.includes('Unauthorized') || error.message?.includes('auth'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
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
    const { startDate, endDate, reason, company, type, included, openDays } = body;

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
      included: included || false,
      openDays: openDays || '',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    console.log('🔧 Adding vacation request to Firebase...');
    
    const requestId = await addVacationRequest(vacationRequest);

    // Send email notification
    try {
      const startDate = new Date(vacationRequest.startDate).toLocaleDateString();
      const endDate = new Date(vacationRequest.endDate).toLocaleDateString();
      
      // Get the correct base URL using environment variable or fallback
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
      const adminUrl = `${baseUrl}/admin/vacation-requests`;
      
      const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .request-details { background: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .action-buttons { text-align: center; margin: 20px 0; }
        .btn { display: inline-block; padding: 12px 24px; margin: 0 10px; text-decoration: none; border-radius: 5px; font-weight: bold; }
        .btn-approve { background-color: #28a745; color: white; }
        .btn-deny { background-color: #dc3545; color: white; }
        .btn-review { background-color: #007bff; color: white; }
        .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏖️ New Vacation Request</h1>
            <p>Stars Vacation Management System</p>
        </div>
        
        <div class="content">
            <h2>Hello Admins,</h2>
            
            <p>A new vacation request has been submitted and requires your review.</p>
            
            <div class="request-details">
                <h3>📋 Request Details:</h3>
                <p><strong>Employee:</strong> ${vacationRequest.userName}</p>
                <p><strong>Email:</strong> ${vacationRequest.userEmail}</p>
                <p><strong>Company:</strong> ${vacationRequest.company}</p>
                <p><strong>Type:</strong> ${vacationRequest.type}</p>
                <p><strong>Start Date:</strong> ${startDate}</p>
                <p><strong>End Date:</strong> ${endDate}</p>
                ${vacationRequest.reason ? `<p><strong>Reason:</strong> ${vacationRequest.reason}</p>` : ''}
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">PENDING</span></p>
            </div>
            
            <div class="action-buttons">
                <a href="${adminUrl}" class="btn btn-review">📋 Review Request</a>
            </div>
            
            <p><strong>To approve or deny this request:</strong></p>
            <ol>
                <li>Click the "Review Request" button above</li>
                <li>Log in to the admin panel if prompted</li>
                <li>Find this request in the pending requests list</li>
                <li>Click "Approve" or "Reject" and add any comments</li>
            </ol>
            
            <p><em>This is an automated notification from the Stars Vacation Management System.</em></p>
        </div>
        
        <div class="footer">
            <p>© 2025 Stars Vacation Management System</p>
            <p>If you have any questions, please contact the system administrator.</p>
        </div>
    </div>
</body>
</html>
      `.trim();

      await sendEmailWithFallbacks(['compta@stars.mc', 'daniel@stars.mc', 'johnny@stars.mc'], '🏖️ New Vacation Request - Action Required', emailBody);
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

 
