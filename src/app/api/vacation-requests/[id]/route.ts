export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { VacationRequest } from '@/lib/firebase';
import { decideVacation } from '@/lib/vacation-orchestration';
import { revalidateTag, revalidatePath } from 'next/cache';
import { syncEventForRequest, refreshCacheTags } from '@/lib/calendar/sync';

// Google Calendar API for Holidays Calendar
const GOOGLE_CALENDAR_ID = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log('🔍 [INVESTIGATION] API PATCH route called');
  try {
    const session = await getServerSession(authOptions) as any;
    console.log('🔍 [INVESTIGATION] Session data:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email, 
      userName: session?.user?.name 
    });
    
    if (!session?.user?.email) {
      console.log('🔍 [INVESTIGATION] Unauthorized - no session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const newStatus = body?.status; // "approved" | "denied"
    const newStartDate = body?.startDate;
    const newEndDate = body?.endDate;
    const newDurationDays = body?.durationDays;
    const adminComment = body?.adminComment;
    
    console.log('🔍 [INVESTIGATION] Request body parsed:', { 
      id, 
      newStatus, 
      newStartDate, 
      newEndDate, 
      newDurationDays, 
      adminComment,
      userEmail: session.user.email 
    });
    
    const reviewer = {
      id: session.user.email,
      name: session.user.name || session.user.email,
      email: session.user.email
    };

    // Check if this is a status update or a general update
    const isStatusUpdate = newStatus && ["approved", "denied"].includes(newStatus);
    const isDateUpdate = newStartDate && newEndDate;
    
    console.log('🔍 [INVESTIGATION] Update type check:', { 
      isStatusUpdate, 
      isDateUpdate, 
      newStatus, 
      validStatuses: ["approved", "denied"].includes(newStatus) 
    });
    
    if (!isStatusUpdate && !isDateUpdate) {
      console.log('🔍 [INVESTIGATION] Invalid update request - returning 400');
      return NextResponse.json({ error: 'Invalid update request - must be status update or date update' }, { status: 400 });
    }

    try {
      // Use Firebase Admin SDK to update the vacation request
      const { db, error } = getFirebaseAdmin();
      if (error || !db) {
        console.error('❌ [INVESTIGATION] Firebase Admin not available:', error);
        return NextResponse.json({ 
          error: 'Firebase Admin not available', 
          details: error 
        }, { status: 500 });
      }

      // Get the current vacation request data
      const docRef = db.collection('vacationRequests').doc(id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'Vacation request not found' }, { status: 404 });
      }
      
      const requestData = { id: docSnap.id, ...docSnap.data() } as VacationRequest;
      
      // Handle status updates
      if (isStatusUpdate) {
        console.log('🔍 [INVESTIGATION] Starting status update:', { id, newStatus, reviewer });
        
        // Get current status before update for debugging
        const currentData = { id: docSnap.id, ...docSnap.data() } as VacationRequest;
        console.log('🔍 [INVESTIGATION] Current status before update:', { id, currentStatus: currentData?.status });
        
                const updateData: any = {
                  status: newStatus,
                  reviewedBy: reviewer.name,
                  reviewerEmail: reviewer.email,
                  reviewedAt: new Date(),
                  approvedByName: reviewer.name,
                  approvedByEmail: reviewer.email,
                  updatedAt: new Date()
                };
        
        // Only include adminComment if it's provided and not undefined
        if (adminComment !== undefined && adminComment !== null && adminComment !== '') {
          updateData.adminComment = adminComment;
        }
        
        console.log('🔍 [INVESTIGATION] Firebase Admin updateData:', updateData);
        console.log('🔍 [INVESTIGATION] Firebase Admin docRef:', docRef.path);
        
        await docRef.update(updateData);
        console.log('🔍 [INVESTIGATION] Firebase Admin updateDoc completed successfully');
        
        // Verify status after update
        const updatedDocSnap = await docRef.get();
        const updatedData = { id: updatedDocSnap.id, ...updatedDocSnap.data() } as VacationRequest;
        console.log('🔍 [INVESTIGATION] Status after update verification:', { 
          id, 
          expectedStatus: newStatus, 
          actualStatus: updatedData?.status,
          success: updatedData?.status === newStatus
        });
      }
      
      // Handle date updates
      if (isDateUpdate) {
        const updateData: any = {
          startDate: newStartDate,
          endDate: newEndDate,
          durationDays: newDurationDays,
          updatedAt: new Date()
        };
        
        if (adminComment) {
          updateData.adminComment = adminComment;
        }
        
        await docRef.update(updateData);
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
          // Prepare vacation request data for email
          const vacationRequestData = {
            id: requestData.id || id,
            userName: requestData.userName || 'Unknown',
            userEmail: requestData.userEmail || 'unknown@stars.mc',
            startDate: requestData.startDate,
            endDate: requestData.endDate,
            reason: requestData.reason || 'No reason provided',
            company: requestData.company || 'Unknown',
            type: requestData.type || 'Full day',
            isHalfDay: requestData.isHalfDay || false,
            halfDayType: requestData.halfDayType || null,
            durationDays: requestData.durationDays || 1,
            status: newStatus,
            createdAt: typeof requestData.createdAt === 'string' 
              ? requestData.createdAt 
              : requestData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            reviewedBy: reviewer.name,
            reviewerEmail: reviewer.email,
            reviewedAt: new Date().toISOString(),
            adminComment: adminComment
          };

          await decideVacation({
            requesterEmail: requestData.userEmail,
            requestId: id,
            decision: newStatus === 'approved' ? 'APPROVED' : 'DENIED',
            startIso: requestData.startDate,
            endIso: requestData.endDate,
            vacationRequestData,
            adminComment,
            reviewedBy: reviewer.name
          });
          console.log(`✅ Decision emails and calendar updates sent for ${newStatus} request`);
        } catch (orchestrationError) {
          console.error('❌ Failed to send decision emails/calendar updates:', orchestrationError);
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

    } catch (error) {
      console.error('❌ Firebase operation failed:', error);
      return NextResponse.json({ 
        error: 'Firebase operation failed', 
        details: error instanceof Error ? error.message : String(error) 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Error updating vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to update vacation request' },
      { status: 500 }
    );
  }
}
