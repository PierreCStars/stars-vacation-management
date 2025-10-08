
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { generateAdminNotificationEmail } from '@/lib/email-templates';
import { sendAdminNotification } from '@/lib/mailer';
import { getBaseUrl } from '@/lib/base-url';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { VacationRequest } from '@/types/vacation';
import { submitVacation } from '@/lib/vacation-orchestration';

// Temporary in-memory storage for testing
export const tempVacationRequests = new Map();

// Initialize with mock data if not already present
if (tempVacationRequests.size === 0) {
  const mockData = [
    {
      id: 'mock-1',
      userId: 'user-1',
      userEmail: 'pierre@stars.mc',
      userName: 'Pierre Corbucci',
      company: 'STARS_MC',
      type: 'VACATION',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      status: 'pending',
      reason: 'Family vacation',
      createdAt: new Date().toISOString(),
      durationDays: 3
    },
    {
      id: 'mock-2',
      userId: 'user-2',
      userEmail: 'daniel@stars.mc',
      userName: 'Daniel Smith',
      company: 'STARS_MC',
      type: 'VACATION',
      startDate: '2025-01-20',
      endDate: '2025-01-22',
      status: 'pending',
      reason: 'Personal time off',
      createdAt: new Date().toISOString(),
      durationDays: 3
    },
    {
      id: 'mock-3',
      userId: 'user-3',
      userEmail: 'johnny@stars.mc',
      userName: 'Johnny Doe',
      company: 'STARS_MC',
      type: 'SICK_LEAVE',
      startDate: '2025-01-25',
      endDate: '2025-01-25',
      status: 'pending',
      reason: 'Medical appointment',
      createdAt: new Date().toISOString(),
      durationDays: 1
    }
  ];
  
  mockData.forEach(request => {
    tempVacationRequests.set(request.id, request);
  });
}

export async function GET() {
  try {
    // Try to load from Firebase first
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.log('⚠️ Firebase Admin not available, falling back to mock data:', error);
    } else {
      try {
        const snapshot = await db.collection('vacationRequests').get();
        const requests = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as VacationRequest[];
        console.log(`📊 Loaded ${requests.length} vacation requests from Firebase`);
        
        // Update mock storage with Firebase data only if it's empty (first load)
        // This preserves any status updates made to mock storage
        if (tempVacationRequests.size === 0) {
          requests.forEach(request => {
            tempVacationRequests.set(request.id, request);
          });
          console.log(`📊 Initialized mock storage with ${requests.length} Firebase requests`);
        } else {
          console.log(`📊 Mock storage already has ${tempVacationRequests.size} requests, preserving status updates`);
        }
        
        // Return mock storage data (which has any status updates) instead of raw Firebase data
        const mockRequests = Array.from(tempVacationRequests.values());
        console.log(`📊 Returning ${mockRequests.length} requests from mock storage (with status updates)`);
        return NextResponse.json(mockRequests);
      } catch (firebaseError) {
        console.log('⚠️ Firebase error, falling back to mock data:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
      }
    }
    
    // Fallback to persistent mock data if Firebase is not available
    const requests = Array.from(tempVacationRequests.values());
    console.log(`📊 Returning ${requests.length} vacation requests from persistent storage`);
    console.log(`📊 Request statuses in storage:`, requests.map(r => ({ id: r.id, status: r.status, userName: r.userName })));
    return NextResponse.json(requests);
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

    const vacationRequestData = await request.json();
    
    // Calculate duration if not provided or invalid
    let durationDays = vacationRequestData.durationDays;
    console.log('🔍 Raw durationDays from frontend:', durationDays);
    console.log('🔍 Vacation request data:', vacationRequestData);
    
    // Always recalculate to ensure accuracy
    if (vacationRequestData.startDate && vacationRequestData.endDate) {
      console.log('🔧 Calculating durationDays...');
      const startDate = new Date(vacationRequestData.startDate);
      const endDate = new Date(vacationRequestData.endDate);
      const timeDiff = endDate.getTime() - startDate.getTime();
      durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end days
      
      // For half days, set to 0.5
      if (vacationRequestData.isHalfDay) {
        durationDays = 0.5;
      }
      console.log('✅ Calculated durationDays:', durationDays);
    } else {
      console.error('❌ Missing startDate or endDate in request data');
      return NextResponse.json({ error: 'Missing required date fields' }, { status: 400 });
    }
    
    // Ensure durationDays is a valid number
    if (typeof durationDays !== 'number' || isNaN(durationDays) || durationDays <= 0) {
      console.error('❌ Invalid durationDays calculated:', durationDays);
      return NextResponse.json({ error: 'Invalid duration calculation' }, { status: 400 });
    }

    // Prepare the vacation request data
    const vacationRequest: Omit<VacationRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      startDate: vacationRequestData.startDate,
      endDate: vacationRequestData.endDate,
      reason: vacationRequestData.reason,
      company: vacationRequestData.company,
      type: vacationRequestData.type,
      status: 'pending',
      isHalfDay: vacationRequestData.isHalfDay || false,
      halfDayType: vacationRequestData.halfDayType || null,
      durationDays: durationDays
    };

    let requestId: string | undefined;
    
    // Try to save to Firebase first
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.log('⚠️ Firebase Admin not available, using temporary storage:', error);
    } else {
      try {
        const docRef = await db.collection('vacationRequests').add({
          ...vacationRequest,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        requestId = docRef.id;
        console.log(`✅ Vacation request saved to Firebase with ID: ${requestId}`);
      } catch (firebaseError) {
        console.log('⚠️ Firebase error, using temporary storage:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
        // Fallback to temporary storage
        requestId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        tempVacationRequests.set(requestId, {
          ...vacationRequest,
          id: requestId,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      }
    }
    
    if (!requestId) {
      // Fallback to temporary storage if Firebase failed
      requestId = `temp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      tempVacationRequests.set(requestId, {
        ...vacationRequest,
        id: requestId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    }

    console.log('🔧 Adding vacation request with ½-day support...', {
      isHalfDay: vacationRequest.isHalfDay,
      halfDayType: vacationRequest.halfDayType,
      durationDays: vacationRequest.durationDays,
      startDate: vacationRequest.startDate,
      endDate: vacationRequest.endDate
    });

    // Check for conflicts (simplified for now)
    const hasConflicts = false; // TODO: Implement actual conflict detection

    // Send emails using orchestration
    try {
      // Prepare detailed vacation request data for email templates
      const vacationRequestData = {
        id: requestId,
        userName: vacationRequest.userName,
        userEmail: vacationRequest.userEmail,
        startDate: vacationRequest.startDate,
        endDate: vacationRequest.endDate,
        reason: vacationRequest.reason || 'No reason provided',
        company: vacationRequest.company,
        type: vacationRequest.type,
        isHalfDay: vacationRequest.isHalfDay || false,
        halfDayType: vacationRequest.halfDayType || null,
        durationDays: vacationRequest.durationDays || 1,
        createdAt: new Date().toISOString(),
        locale: 'en' // Default locale, could be extracted from request headers if needed
      };

      await submitVacation({
        requesterEmail: vacationRequest.userEmail,
        requestId,
        startIso: vacationRequest.startDate,
        endIso: vacationRequest.endDate,
        vacationRequestData
      });
      console.log('✅ Vacation request emails sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send vacation request emails:', emailError);
    }

    console.log('✅ Vacation request prepared for Google Calendar integration');

    return NextResponse.json({ 
      success: true, 
      id: requestId,
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

 
