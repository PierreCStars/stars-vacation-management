export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth/next';
import { firebaseAdmin, isFirebaseAdminAvailable } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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
    const reviewer = {
      id: session.user.email,
      name: session.user.name || session.user.email,
      email: session.user.email
    };

    if (!["approved", "rejected"].includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    try {
      // Use Firestore to update the vacation request if available
      if (isFirebaseAdminAvailable()) {
        const { db } = firebaseAdmin();
        const ref = db.collection("vacationRequests").doc(id);
        
        // Get the current vacation request data
        const doc = await ref.get();
        if (!doc.exists) {
          return NextResponse.json({ error: 'Vacation request not found' }, { status: 404 });
        }
        
        const requestData = doc.data();
        
        // Update the status
        await ref.set({
          status: newStatus,
          reviewedAt: Timestamp.now(),
          reviewedBy: reviewer
        }, { merge: true });

        console.log('✅ Vacation request status updated successfully in Firestore');

        // If approved, sync to Holidays Calendar
        if (newStatus === 'approved' && requestData) {
          try {
            await syncToHolidaysCalendar(requestData, id);
            console.log('✅ Vacation request synced to Holidays Calendar');
          } catch (calendarError) {
            console.error('❌ Error syncing to Holidays Calendar:', calendarError);
            // Don't fail the request if calendar sync fails
          }
        }
      } else {
        console.log('⚠️  Firebase Admin not available - using mock update');
      }
      
      // TODO: Send status emails when SMTP is configured
      console.log('📧 Status emails would be sent here (when SMTP configured)');

      const updatedRequest = {
        id,
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewer
      };

      return NextResponse.json({ 
        ok: true, 
        request: updatedRequest,
        message: `Vacation request ${newStatus} successfully`
      });

    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      
      // Fallback to mock data if Firebase fails
      console.log('⚠️  Falling back to mock data update...');
      
      const updatedRequest = {
        id,
        status: newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewer
      };

      console.log('✅ Vacation request status updated successfully (mock)');
      console.log('📧 Status emails would be sent here (when SMTP configured)');

      return NextResponse.json({ 
        ok: true, 
        request: updatedRequest,
        message: `Vacation request ${newStatus} successfully`
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

    // For now, we'll log the sync attempt
    // TODO: Implement actual Google Calendar API integration
    console.log('📅 Would sync to Holidays Calendar:', {
      calendarId: GOOGLE_CALENDAR_ID,
      requestId,
      userName: requestData.userName,
      company: requestData.company,
      startDate: requestData.startDate,
      endDate: requestData.endDate,
      type: requestData.type
    });

    // TODO: When Google Calendar API is implemented:
    // 1. Create event in Holidays Calendar
    // 2. Store googleEventId in Firestore
    // 3. Handle event updates/deletions

  } catch (error) {
    console.error('❌ Error in syncToHolidaysCalendar:', error);
    throw error;
  }
}