export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getVacationRequestsService } from '@/lib/firebase';
import { VacationRequest } from '@/lib/firebase';
import { decideVacation } from '@/lib/vacation-orchestration';
import { revalidateTag, revalidatePath } from 'next/cache';
import { syncEventForRequest, refreshCacheTags } from '@/lib/calendar/sync';

// Google Calendar API for Holidays Calendar
const GOOGLE_CALENDAR_ID = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
      console.log('[VALIDATION] unauthorized', { userEmail: session?.user?.email });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const newStatus = body?.status; // "approved" | "denied"
    const newStartDate = body?.startDate;
    const newEndDate = body?.endDate;
    const newDurationDays = body?.durationDays;
    const adminComment = body?.adminComment;
    
    console.log('[VALIDATION] start', { id, newStatus, userEmail: session.user.email });
    
    const reviewer = {
      id: session.user.email,
      name: session.user.name || session.user.email,
      email: session.user.email
    };

    // Check if this is a status update or a general update
    const isStatusUpdate = newStatus && ["approved", "denied"].includes(newStatus);
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
          console.log('[VALIDATION] updating_status', { id, newStatus, reviewer });
          
          // Get current status before update for debugging
          const currentData = await vacationService.getVacationRequestById(id);
          console.log('[VALIDATION] current_status_before', { id, currentStatus: currentData?.status });
          
          if (newStatus === 'approved') {
            await vacationService.approveVacationRequest(
              id, 
              reviewer.name, 
              reviewer.email, 
              adminComment
            );
            console.log('[VALIDATION] approved', { id });
          } else if (newStatus === 'denied') {
            await vacationService.rejectVacationRequest(
              id, 
              reviewer.name, 
              reviewer.email, 
              adminComment
            );
            console.log('[VALIDATION] denied', { id });
          }
          
          // Verify status after update
          const updatedData = await vacationService.getVacationRequestById(id);
          console.log('[VALIDATION] status_after_update', { id, newStatus, actualStatus: updatedData?.status });
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

        // Sync calendar event based on new status
        if (isStatusUpdate && requestData) {
          try {
            const calendarData = {
              id: requestData.id || id,
              userName: requestData.userName || 'Unknown',
              userEmail: requestData.userEmail || 'unknown@stars.mc',
              startDate: requestData.startDate,
              endDate: requestData.endDate,
              type: requestData.type || 'Full day',
              company: requestData.company || 'Unknown',
              reason: requestData.reason,
              status: newStatus as 'pending' | 'approved' | 'denied'
            };
            
            const calendarResult = await syncEventForRequest(calendarData);
            if (calendarResult.success) {
              console.log('[VALIDATION] calendar_sync success', { id, eventId: calendarResult.eventId });
            } else {
              console.error('[VALIDATION] calendar_sync fail', { id, error: calendarResult.error });
              // Don't fail the request if calendar sync fails
            }
          } catch (calendarError) {
            console.error('[VALIDATION] calendar_sync error', { id, error: calendarError instanceof Error ? calendarError.message : String(calendarError) });
            // Don't fail the request if calendar sync fails
          }
        }

        // Invalidate caches after successful update
        try {
          await refreshCacheTags();
        } catch (cacheError) {
          console.error('[CACHE] revalidate fail', { error: cacheError instanceof Error ? cacheError.message : String(cacheError) });
        }

        // Send decision emails and calendar updates using orchestration
        if (isStatusUpdate && newStatus && (newStatus === 'approved' || newStatus === 'denied')) {
          try {
            await decideVacation({
              requesterEmail: requestData.userEmail,
              requestId: id,
              decision: newStatus === 'approved' ? 'APPROVED' : 'DENIED',
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
      }
      
      // Always update mock storage as fallback (regardless of Firebase success/failure)
      if (isStatusUpdate && newStatus) {
        console.log(`🔄 Updating mock storage for request ${id} with status ${newStatus}`);
        try {
          // Import the persistent storage from the main route
          const { tempVacationRequests } = await import('../route');
          
          const existingRequest = tempVacationRequests.get(id);
          console.log(`🔍 Existing request in mock storage:`, existingRequest ? 'found' : 'not found');
          
          if (existingRequest) {
            const updatedRequest = {
              ...existingRequest,
              status: newStatus,
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewer.name,
              reviewerEmail: reviewer.email,
              adminComment: adminComment
            };
            tempVacationRequests.set(id, updatedRequest);
            console.log(`✅ Updated mock request ${id} with status ${newStatus}:`, updatedRequest);
          } else {
            console.log(`❌ Request ${id} not found in mock storage`);
          }
        } catch (mockError) {
          console.error('❌ Failed to update mock storage:', mockError);
        }
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
