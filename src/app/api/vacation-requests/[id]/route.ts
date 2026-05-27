export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { VacationRequest } from '@/lib/firebase';
import { decideVacation } from '@/lib/vacation-orchestration';
import { revalidateTag, revalidatePath } from 'next/cache';
import { syncEventForRequest, refreshCacheTags } from '@/lib/calendar/sync';
import { normalizeVacationFields, normalizeVacationStatus } from '@/lib/normalize-vacation-fields';
import { isFullAdmin } from '@/config/admins';
import { calendarClient, CAL_TARGET } from '@/lib/google-calendar';

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
    const newStatus = body?.status; // "approved" | "denied" | "cancelled"
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
    
    // Check if this is a status update or a general update
    const isStatusUpdate = newStatus && ["approved", "denied", "cancelled"].includes(newStatus);
    const isDateUpdate = newStartDate && newEndDate;
    
    console.log('🔍 [INVESTIGATION] Update type check:', { 
      isStatusUpdate, 
      isDateUpdate, 
      newStatus, 
      validStatuses: ["approved", "denied", "cancelled"].includes(newStatus) 
    });
    
    // CRITICAL FIX: Check admin authorization for status updates (approve/deny)
    if (isStatusUpdate) {
      const userEmail = session.user.email;
      if (!isFullAdmin(userEmail)) {
        console.log('🔍 [INVESTIGATION] Forbidden - user is not a full admin:', { userEmail });
        return NextResponse.json({
          error: 'Forbidden - Admin access required to approve or deny vacation requests'
        }, { status: 403 });
      }
      // Cancelling an already-validated leave is restricted to a single admin.
      if (newStatus === 'cancelled' && userEmail.toLowerCase() !== 'johnny@stars.mc') {
        console.log('🔍 [INVESTIGATION] Forbidden - only johnny@stars.mc may cancel validated leaves:', { userEmail });
        return NextResponse.json({
          error: 'Forbidden - Only johnny@stars.mc can cancel a validated vacation request',
        }, { status: 403 });
      }
      console.log('🔍 [INVESTIGATION] Admin authorization verified:', { userEmail });
    }
    
    // For date updates, we still allow the requester to update their own request
    // but we'll check ownership in the date update section if needed
    
    if (!isStatusUpdate && !isDateUpdate) {
      console.log('🔍 [INVESTIGATION] Invalid update request - returning 400');
      return NextResponse.json({ error: 'Invalid update request - must be status update or date update' }, { status: 400 });
    }
    
    const reviewer = {
      id: session.user.email,
      name: session.user.name || session.user.email,
      email: session.user.email
    };

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
        
        // Normalize status to canonical value
        const normalizedFields = normalizeVacationFields({ status: newStatus });
        
        const updateData: any = {
          status: normalizedFields.status || newStatus,
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

      // Sync calendar event based on new status or date changes
      // For status updates: sync to create/delete events
      // For date updates: sync to update existing events (if approved)
      if ((isStatusUpdate || isDateUpdate) && requestData) {
        try {
          // Get the current status (may have been updated or may be existing)
          const currentStatus = isStatusUpdate ? newStatus : (requestData.status || 'pending');
          
          const calendarData = {
            id: requestData.id || id,
            userName: requestData.userName || 'Unknown',
            userEmail: requestData.userEmail || 'unknown@stars.mc',
            startDate: isDateUpdate ? newStartDate : requestData.startDate,
            endDate: isDateUpdate ? newEndDate : requestData.endDate,
            type: requestData.type || 'Full day',
            company: requestData.company || 'Unknown',
            reason: requestData.reason,
            status: currentStatus as 'pending' | 'approved' | 'denied' | 'cancelled'
          };
          
          const calendarResult = await syncEventForRequest(calendarData);
          if (calendarResult.success) {
            console.log('[VALIDATION] calendar_sync success', { 
              id, 
              eventId: calendarResult.eventId,
              updateType: isStatusUpdate ? 'status' : 'dates'
            });
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

/**
 * Hard-delete a vacation request.
 *
 * Guard rails:
 * - Full-admin only.
 * - Only PENDING requests can be deleted (approved/denied/cancelled keep their
 *   audit trail — cancel an approved one via PATCH status=cancelled instead).
 * - Removes the linked Google Calendar event if any, then the Firestore doc.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isFullAdmin(session.user.email)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required to delete vacation requests' },
        { status: 403 },
      );
    }

    const { id } = await params;
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json(
        { error: 'Firebase Admin not available', details: error },
        { status: 500 },
      );
    }

    const docRef = db.collection('vacationRequests').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const data = snap.data() as any;
    const status = normalizeVacationStatus(data?.status).toLowerCase();
    if (status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Only pending requests can be deleted',
          message: `This request is "${status}". To remove an approved request, cancel it instead.`,
        },
        { status: 409 },
      );
    }

    // Best-effort calendar event removal (a pending request usually has none,
    // but some flows pre-create events).
    const eventId = data?.calendarEventId || data?.googleCalendarEventId || data?.googleEventId;
    if (eventId) {
      try {
        const cal = calendarClient();
        await cal.events.delete({ calendarId: CAL_TARGET, eventId });
      } catch (calErr: any) {
        if (calErr?.code !== 404) {
          console.warn(`[DELETE] Failed to remove calendar event ${eventId}:`, calErr?.message);
        }
      }
    }

    await docRef.delete();

    // Refresh any cached views that include vacation data
    try {
      revalidateTag('vacations');
      revalidatePath('/[locale]/admin/vacation-requests', 'page');
    } catch {
      /* non-fatal */
    }

    console.log(`[DELETE] Pending request ${id} hard-deleted by ${session.user.email}`);
    return NextResponse.json({ success: true, deletedId: id });

  } catch (error) {
    console.error('❌ Error deleting vacation request:', error);
    return NextResponse.json(
      { error: 'Failed to delete vacation request' },
      { status: 500 },
    );
  }
}
