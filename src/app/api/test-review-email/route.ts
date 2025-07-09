import { NextResponse } from 'next/server';
import { sendEmailWithFallbacks } from '@/lib/simple-email-service';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing admin review email functionality...');
    
    // Get status from query parameter, default to APPROVED
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'APPROVED';
    
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status. Must be APPROVED or REJECTED',
        message: 'Use ?status=APPROVED or ?status=REJECTED in the URL'
      }, { status: 400 });
    }
    
    // Simulate a vacation request review
    const mockRequest = {
      userEmail: 'pierre@stars.mc',
      userName: 'Pierre Corbucci',
      company: 'Stars MC',
      type: 'Vacation',
      startDate: '2025-01-15',
      endDate: '2025-01-20',
      status: status
    };
    
    const emailSubject = `Vacation Request ${mockRequest.status} - ${mockRequest.userName}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stars-vacation-management-dpv42teb7-pierres-projects-bba7ee64.vercel.app';
    
    // Email to employee (simulating the admin review email)
    const employeeEmailBody = `
<h2>Vacation Request ${mockRequest.status}</h2>

<p>Hello ${mockRequest.userName},</p>

<p>Your vacation request has been <strong>${mockRequest.status.toLowerCase()}</strong>.</p>

<h3>Request Details:</h3>
<ul>
  <li><strong>Employee:</strong> ${mockRequest.userName}</li>
  <li><strong>Company:</strong> ${mockRequest.company}</li>
  <li><strong>Type:</strong> ${mockRequest.type}</li>
  <li><strong>Start Date:</strong> ${new Date(mockRequest.startDate).toLocaleDateString()}</li>
  <li><strong>End Date:</strong> ${new Date(mockRequest.endDate).toLocaleDateString()}</li>
  <li><strong>Status:</strong> ${mockRequest.status}</li>
  <li><strong>Reviewed By:</strong> Pierre Corbucci (Admin)</li>
  <li><strong>Review Date:</strong> ${new Date().toLocaleDateString()}</li>
</ul>

<h3>Admin Comment:</h3>
<p>This is a test email to verify the admin review notification system is working correctly. Status: ${mockRequest.status}</p>

<p>View your request at: <a href="${baseUrl}/vacation-request">${baseUrl}/vacation-request</a></p>
    `.trim();

    const result = await sendEmailWithFallbacks([mockRequest.userEmail], emailSubject, employeeEmailBody);
    
    console.log('📧 Admin review email test result:', result);
    
    return NextResponse.json({
      success: true,
      emailResult: result,
      message: `Admin review email test completed for status: ${mockRequest.status}. Check your inbox for the test email.`,
      testData: {
        to: mockRequest.userEmail,
        subject: emailSubject,
        status: mockRequest.status,
        testUrls: {
          approved: `${request.url}?status=APPROVED`,
          rejected: `${request.url}?status=REJECTED`
        }
      }
    });
  } catch (error) {
    console.error('❌ Admin review email test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Admin review email test failed. Check the logs for details.'
    }, { status: 500 });
  }
} 