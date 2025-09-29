
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { adminVacationSubject, adminVacationHtml, adminVacationText } from '@/lib/email-templates';
import { sendAdminNotification } from '@/lib/mailer';
import { getBaseUrl } from '@/lib/base-url';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { VacationRequest } from '@/types/vacation';
import { submitVacation } from '@/lib/vacation-orchestration';

// Temporary in-memory storage for testing
const tempVacationRequests = new Map();

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
        return NextResponse.json(requests);
      } catch (firebaseError) {
        console.log('⚠️ Firebase error, falling back to mock data:', firebaseError instanceof Error ? firebaseError.message : String(firebaseError));
      }
    }
    
    // Fallback to mock data if Firebase is not available
    const mockData = [
        {
          id: 'temp-1',
          userId: 'john@example.com',
          userName: 'John Smith',
          userEmail: 'john@example.com',
          company: 'Stars Yachting',
          type: 'Full day',
          startDate: '2025-01-15',
          endDate: '2025-01-17',
          status: 'pending',
          isHalfDay: false,
          halfDayType: null,
          durationDays: 3,
          createdAt: '2025-01-08T10:00:00Z'
        },
        {
          id: 'temp-2',
          userId: 'jane@example.com',
          userName: 'Jane Doe',
          userEmail: 'jane@example.com',
          company: 'Stars Real Estate',
          type: 'Half day AM',
          startDate: '2025-01-20',
          endDate: '2025-01-20',
          status: 'pending',
          isHalfDay: true,
          halfDayType: 'morning',
          durationDays: 1,
          createdAt: '2025-01-09T14:30:00Z'
        },
        {
          id: 'temp-3',
          userId: 'mike@example.com',
          userName: 'Mike Wilson',
          userEmail: 'mike@example.com',
          company: 'Le Pneu',
          type: 'Full day',
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          status: 'approved',
          isHalfDay: false,
          halfDayType: null,
          durationDays: 3,
          createdAt: '2025-01-07T09:15:00Z',
          reviewedAt: '2025-01-08T10:00:00Z',
          reviewedBy: 'Admin User',
          reviewerEmail: 'admin@stars.mc'
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
      await submitVacation({
        requesterEmail: vacationRequest.userEmail,
        requestId,
        startIso: vacationRequest.startDate,
        endIso: vacationRequest.endDate
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

 
