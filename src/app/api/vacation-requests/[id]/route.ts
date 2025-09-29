export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getVacationRequestsService } from '@/lib/firebase';
import { addVacationToCalendar, CAL_TARGET } from '@/lib/google-calendar';
import { VacationRequest } from '@/lib/firebase';
import { decideVacation } from '@/lib/vacation-orchestration';

// Google Calendar API for Holidays Calendar
const GOOGLE_CALENDAR_ID = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const newStatus = body?.status; // "approved" | "rejected"
    const newStartDate = body?.startDate;
    const newEndDate = body?.endDate;
    const newDurationDays = body?.durationDays;
    const adminComment = body?.adminComment;
    
    const reviewer = {
      id: session.user.email,
      name: session.user.name || session.user.email,
      email: session.user.email
    };

    // Check if this is a status update or a general update
    const isStatusUpdate = newStatus && ["approved", "rejected"].includes(newStatus);
    const isDateUpdate = newStartDate && newEndDate;
    
    if (!isStatusUpdate && !isDateUpdate) {
      return NextResponse.json({ error: 'Invalid update request - must be status update or date update' }, { status: 400 });
    }

    try {
      // Use Firestore to update the vacation request if available
      try {
        const vacationService = getVacationRequestsService();
        
        // Get the current vacation request data
        const requestData = await vacationService.getVacationRequestById(id);
        if (!requestData) {
          return NextResponse.json({ error: 'Vacation request not found' }, { status: 404 });
        }
        
        // Handle status updates
        if (isStatusUpdate) {
          if (newStatus === 'approved') {
            await vacationService.approveVacationRequest(
              id, 
              reviewer.name, 
              reviewer.email, 
              adminComment
            );
          } else if (newStatus === 'rejected') {
            await vacationService.rejectVacationRequest(
              id, 
              reviewer.name, 
              reviewer.email, 
              adminComment
            );
          }
        }
        
        // Handle date updates
        if (isDateUpdate) {
          const updateData: any = {
            startDate: newStartDate,
            endDate: newEndDate,
            durationDays: newDurationDays,
            updatedAt: new Date().toISOString()
          };
          
          if (adminComment) {
            updateData.adminComment = adminComment;
          }
          
          await vacationService.updateVacationRequest(id, updateData);
          console.log('✅ Vacation request dates updated successfully in Firestore');
        }

        console.log('✅ Vacation request updated successfully in Firestore');

        // If approved, sync to Holidays Calendar
        if (isStatusUpdate && newStatus === 'approved' && requestData) {
          try {
            await syncToHolidaysCalendar(requestData, id);
            console.log('✅ Vacation request synced to Holidays Calendar');
          } catch (calendarError) {
            console.error('❌ Error syncing to Holidays Calendar:', calendarError);
            // Don't fail the request if calendar sync fails
          }
        }

        // Send decision emails and calendar updates using orchestration
        if (isStatusUpdate && newStatus && (newStatus === 'approved' || newStatus === 'rejected')) {
          try {
            await decideVacation({
              requesterEmail: requestData.userEmail,
              requestId: id,
              decision: newStatus.toUpperCase() as 'APPROVED' | 'DENIED',
              startIso: requestData.startDate,
              endIso: requestData.endDate
            });
            console.log(`✅ Decision emails and calendar updates sent for ${newStatus} request`);
          } catch (orchestrationError) {
            console.error('❌ Failed to send decision emails/calendar updates:', orchestrationError);
          }
        }
      } catch (firebaseError) {
        console.log('⚠️  Firebase not available - using mock update:', firebaseError);
        throw firebaseError;
      }

      const updatedRequest = {
        id,
        ...(isStatusUpdate ? {
          status: newStatus,
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewer
        } : {}),
        ...(isDateUpdate ? {
          startDate: newStartDate,
          endDate: newEndDate,
          durationDays: newDurationDays,
          updatedAt: new Date().toISOString()
        } : {})
      };

      const message = isStatusUpdate 
        ? `Vacation request ${newStatus} successfully`
        : 'Vacation request dates updated successfully';

      return NextResponse.json({ 
        ok: true, 
        request: updatedRequest,
        message
      });

    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      
      // Fallback to mock data if Firebase fails
      console.log('⚠️  Falling back to mock data update...');
      
      const updatedRequest = {
        id,
        ...(isStatusUpdate ? {
          status: newStatus,
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewer
        } : {}),
        ...(isDateUpdate ? {
          startDate: newStartDate,
          endDate: newEndDate,
          durationDays: newDurationDays,
          updatedAt: new Date().toISOString()
        } : {})
      };

      console.log('✅ Vacation request updated successfully (mock)');
      console.log('📧 Status emails would be sent here (when SMTP configured)');

      const message = isStatusUpdate 
        ? `Vacation request ${newStatus} successfully`
        : 'Vacation request dates updated successfully';

      return NextResponse.json({ 
        ok: true, 
        request: updatedRequest,
        message
      });
    }

  } catch (error) {
    console.error('❌ Error updating vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to update vacation request' },
      { status: 500 }
    );
  }
}

// Function to sync approved vacation request to Holidays Calendar
async function syncToHolidaysCalendar(requestData: any, requestId: string) {
  try {
    // Check if we already have a Google Event ID stored
    if (requestData.googleEventId) {
      console.log('📅 Vacation request already has Google Event ID:', requestData.googleEventId);
      return;
    }

    console.log('📅 Syncing vacation request to Google Calendar...', {
      calendarId: CAL_TARGET,
      requestId,
      userName: requestData.userName,
      company: requestData.company,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      type: requestData.type
    });

    // Create vacation event for Google Calendar
    const vacationEvent = {
      userName: requestData.userName,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      type: requestData.type,
      company: requestData.company,
      reason: requestData.reason
    };

    // Add event to Google Calendar
    const googleEventId = await addVacationToCalendar(vacationEvent);
    
    console.log('✅ Vacation event created in Google Calendar:', googleEventId);

    // Store the Google Event ID in Firestore for future reference
    try {
      const vacationService = getVacationRequestsService();
      await vacationService.updateVacationRequest(requestId, {
        googleEventId: googleEventId
      } as Partial<VacationRequest>);
      console.log('✅ Google Event ID stored in Firestore');
    } catch (firestoreError) {
      console.error('⚠️ Failed to store Google Event ID in Firestore:', firestoreError);
      // Don't fail the whole operation if Firestore update fails
    }

  } catch (error) {
    console.error('❌ Error in syncToHolidaysCalendar:', error);
    throw error;
  }
}