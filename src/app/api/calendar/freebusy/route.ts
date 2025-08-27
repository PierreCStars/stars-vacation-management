import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { detectCalendarConflicts, FreeBusyRequest } from '@/lib/google/calendar-client';

// Ensure this route runs in Node.js runtime for googleapis compatibility
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin access or is the requester
    if (!session.user.email.endsWith('@stars.mc')) {
      return NextResponse.json(
        { error: 'Access denied. Only @stars.mc users can access this endpoint.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: FreeBusyRequest = await request.json();
    
    // Validate required fields
    if (!body.start || !body.end) {
      return NextResponse.json(
        { error: 'Missing required fields: start and end dates are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const startDate = new Date(body.start);
    const endDate = new Date(body.end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      );
    }

    console.log('🔍 Checking calendar conflicts for:', {
      requesterUserId: body.requesterUserId,
      start: body.start,
      end: body.end,
      calendarIds: body.calendarIds || 'primary'
    });

    // Detect calendar conflicts
    const conflicts = await detectCalendarConflicts(body);

    console.log(`✅ Found ${conflicts.totalConflicts} calendar conflicts`);

    return NextResponse.json({
      success: true,
      ...conflicts,
      request: {
        start: body.start,
        end: body.end,
        calendarIds: body.calendarIds || ['primary']
      }
    });

  } catch (error) {
    console.error('❌ Error in calendar freebusy API:', error);
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('GOOGLE_SERVICE_ACCOUNT_KEY')) {
        return NextResponse.json(
          { 
            error: 'Google Calendar service not configured',
            details: 'Service account key is missing or invalid'
          },
          { status: 500 }
        );
      }
      
      if (error.message.includes('PERMISSION_DENIED')) {
        return NextResponse.json(
          { 
            error: 'Calendar access denied',
            details: 'The service account does not have permission to access the specified calendars'
          },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}

// GET method for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Calendar FreeBusy API',
    method: 'POST',
    description: 'Check for calendar conflicts during vacation requests',
    example: {
      requesterUserId: 'user123',
      start: '2025-08-15T00:00:00.000Z',
      end: '2025-08-20T23:59:59.999Z',
      calendarIds: ['primary', 'team@stars.mc']
    }
  });
}
