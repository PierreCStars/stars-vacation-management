import { NextRequest, NextResponse } from 'next/server';
import { getVacationRequestsService } from '@/lib/firebase';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const company = searchParams.get('company');
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const requestId = searchParams.get('id'); // Optional: exclude current request from conflicts

    if (!company || !start || !end) {
      return NextResponse.json({ 
        error: 'Missing required parameters: company, start, end' 
      }, { status: 400 });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid date format' 
      }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ 
        error: 'Start date must be before or equal to end date' 
      }, { status: 400 });
    }

    try {
      // Get all vacation requests from Firebase
      const vacationService = getVacationRequestsService();
      const allRequests = await vacationService.getAllVacationRequests();
      
      // Filter for conflicts using inclusive overlap rule:
      // (existing.startDate <= newEnd) && (existing.endDate >= newStart)
      const conflicts = allRequests.filter(request => {
        // Skip the current request if ID is provided
        if (requestId && request.id === requestId) {
          return false;
        }

        // Only check requests from the same company
        if (request.company !== company) {
          return false;
        }

        // Only check approved or pending requests (not rejected)
        if (!['approved', 'pending'].includes(request.status.toLowerCase())) {
          return false;
        }

        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);

        // Check for overlap using inclusive rule
        const hasOverlap = (requestStart <= endDate) && (requestEnd >= startDate);
        
        return hasOverlap;
      });

      // Format conflicts for frontend
      const formattedConflicts = conflicts.map(conflict => ({
        id: conflict.id,
        userName: conflict.userName,
        userEmail: conflict.userEmail,
        startDate: conflict.startDate,
        endDate: conflict.endDate,
        status: conflict.status,
        type: conflict.type,
        isHalfDay: conflict.isHalfDay,
        halfDayType: conflict.halfDayType,
        reason: conflict.reason,
        company: conflict.company,
        createdAt: conflict.createdAt
      }));

      return NextResponse.json({
        hasConflicts: formattedConflicts.length > 0,
        conflicts: formattedConflicts,
        summary: `${formattedConflicts.length} conflicting vacation request${formattedConflicts.length === 1 ? '' : 's'} found`,
        searchParams: {
          company,
          start,
          end,
          requestId: requestId || null
        }
      });

    } catch (firebaseError) {
      console.error('❌ Firebase error in conflicts API:', firebaseError);
      
      // Fallback to mock data for development
      const mockConflicts = [
        {
          id: 'mock-conflict-1',
          userName: 'Test User',
          userEmail: 'test@example.com',
          startDate: start,
          endDate: end,
          status: 'approved',
          type: 'Full day',
          isHalfDay: false,
          halfDayType: null,
          reason: 'Annual vacation',
          company: company,
          createdAt: new Date().toISOString()
        }
      ];

      return NextResponse.json({
        hasConflicts: true,
        conflicts: mockConflicts,
        summary: '1 mock conflicting vacation request found (Firebase unavailable)',
        searchParams: {
          company,
          start,
          end,
          requestId: requestId || null
        },
        warning: 'Using mock data - Firebase unavailable'
      });
    }

  } catch (error) {
    console.error('❌ Error in conflicts API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      hasConflicts: false,
      conflicts: [],
      summary: 'Error occurred while checking conflicts'
    }, { status: 500 });
  }
}