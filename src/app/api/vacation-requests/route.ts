
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminVacationSubject, adminVacationHtml, adminVacationText } from '@/lib/email-templates';
import { sendAdminNotification } from '@/lib/mailer';
import { getBaseUrl } from '@/lib/base-url';

// Temporary in-memory storage for testing
const tempVacationRequests = new Map();

export async function GET() {
  try {
    // For now, return mock data in the correct format
    // TODO: Replace with Firestore when enabled
    const mockData = [
      {
        id: 'temp-1',
        userName: 'John Smith',
        company: 'Stars Yachting',
        type: 'Full day',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        status: 'pending',
        userEmail: 'john@example.com',
        isHalfDay: false,
        halfDayType: null,
        durationDays: 3,
        createdAt: '2025-01-08T10:00:00Z'
      },
      {
        id: 'temp-2',
        userName: 'Jane Doe',
        company: 'Stars Real Estate',
        type: 'Half day AM',
        startDate: '2025-01-20',
        endDate: '2025-01-20',
        status: 'pending',
        userEmail: 'jane@example.com',
        isHalfDay: true,
        halfDayType: 'morning',
        durationDays: 1,
        createdAt: '2025-01-09T14:30:00Z'
      },
      {
        id: 'temp-3',
        userName: 'Mike Wilson',
        company: 'Le Pneu',
        type: 'Full day',
        startDate: '2025-01-10',
        endDate: '2025-01-12',
        status: 'approved',
        userEmail: 'mike@example.com',
        isHalfDay: false,
        halfDayType: null,
        durationDays: 3,
        createdAt: '2025-01-07T09:15:00Z',
        reviewedAt: '2025-01-08T10:00:00Z',
        reviewedBy: { id: 'admin@stars.mc', name: 'Admin User', email: 'admin@stars.mc' }
      }
    ];

    return NextResponse.json(mockData);
  } catch (error) {
    console.error('❌ Error fetching vacation requests:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vacationRequest = await request.json();
    
    // Generate a temporary ID
    const tempRequestId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Add the request to temporary storage
    tempVacationRequests.set(tempRequestId, {
      ...vacationRequest,
      id: tempRequestId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      userEmail: session.user.email,
      userName: session.user.name || session.user.email
    });

    console.log('🔧 Adding vacation request with ½-day support...', {
      isHalfDay: vacationRequest.isHalfDay,
      halfDayType: vacationRequest.halfDayType,
      durationDays: vacationRequest.durationDays,
      startDate: vacationRequest.startDate,
      endDate: vacationRequest.endDate
    });

    // Check for conflicts (simplified for now)
    const hasConflicts = false; // TODO: Implement actual conflict detection

    // Send admin notification email
    try {
      const baseUrl = getBaseUrl();
      // Fix: Include locale prefix in the review URL
      const reviewUrl = `${baseUrl}/en/admin/vacation-requests/${tempRequestId}`;

      // Get company name from the request or use default
      const companyName = vacationRequest.company || 'Stars MC';

      const subject = adminVacationSubject({
        hasConflicts,
        userName: vacationRequest.userName,
      });

      const html = adminVacationHtml({
        userName: vacationRequest.userName,
        companyName,
        startDate: vacationRequest.startDate,
        endDate: vacationRequest.endDate,
        isHalfDay: vacationRequest.isHalfDay,
        halfDayType: vacationRequest.halfDayType,
        hasConflicts,
        reviewUrl,
      });

      const text = adminVacationText({
        userName: vacationRequest.userName,
        companyName,
        startDate: vacationRequest.startDate,
        endDate: vacationRequest.endDate,
        isHalfDay: vacationRequest.isHalfDay,
        halfDayType: vacationRequest.halfDayType,
        hasConflicts,
      });

      // Send email to all admins
      await sendAdminNotification({ subject, html, text });

      console.log('✅ Admin notification email sent successfully');
      if (hasConflicts) {
        console.log('⚠️ Conflict warning included in email');
      }
    } catch (emailError) {
      console.error('❌ Failed to send admin notification:', emailError);
    }

    console.log('✅ Vacation request prepared for Google Calendar (disabled for testing)');

    return NextResponse.json({ 
      success: true, 
      id: tempRequestId,
      message: 'Vacation request submitted successfully' 
    });

  } catch (error) {
    console.error('❌ Error submitting vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to submit vacation request' },
      { status: 500 }
    );
  }
}

 
