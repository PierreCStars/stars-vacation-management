
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
import { mapFromFirestore } from '@/lib/requests/mapFromFirestore';
import { submitVacation } from '@/lib/vacation-orchestration';

// No mock data - Firebase only

export async function GET() {
  try {
    console.log('[REQS] Source=FIRESTORE, projectId=', process.env.FIREBASE_PROJECT_ID);
    
    // Firebase is required - no fallbacks
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase not available', 
        details: error 
      }, { status: 500 });
    }

    console.log('🔥 Firebase Admin connected, querying vacationRequests collection...');
    const snapshot = await db.collection('vacationRequests').get();
    const requests = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return mapFromFirestore(doc.id, data);
    });
    
    console.log(`📊 Loaded ${requests.length} vacation requests from Firebase`);
    console.log('📊 Firebase requests:', requests.map(r => ({ id: r.id, userName: r.userName, status: r.status })));
    
    return NextResponse.json(requests);
  } catch (error) {
    console.error('❌ Error fetching vacation requests:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch vacation requests',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vacationRequestData = await request.json();
    
    // Extract locale from request headers or default to 'en'
    const acceptLanguage = request.headers.get('accept-language') || '';
    const locale = acceptLanguage.includes('fr') ? 'fr' : 
                   acceptLanguage.includes('it') ? 'it' : 'en';
    
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
    // If status and denialReason are provided (from auto-deny), use them
    const status = vacationRequestData.status === 'denied' ? 'denied' : 'pending';
    const vacationRequest: Omit<VacationRequest, 'id' | 'createdAt' | 'updatedAt'> = {
      userId: session.user.email,
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      startDate: vacationRequestData.startDate,
      endDate: vacationRequestData.endDate,
      reason: vacationRequestData.reason,
      company: vacationRequestData.company,
      type: vacationRequestData.type,
      status: status,
      isHalfDay: vacationRequestData.isHalfDay || false,
      halfDayType: vacationRequestData.halfDayType || null,
      durationDays: durationDays,
      // Include denialReason if provided (for auto-denied requests)
      ...(vacationRequestData.denialReason && { denialReason: vacationRequestData.denialReason }),
      // Set reviewedAt if auto-denied
      ...(status === 'denied' && { reviewedAt: new Date().toISOString() })
    };

    // Firebase is required - no fallbacks
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('❌ Firebase Admin not available:', error);
      return NextResponse.json({ 
        error: 'Firebase not available', 
        details: error 
      }, { status: 500 });
    }

    const docRef = await db.collection('vacationRequests').add({
      ...vacationRequest,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const requestId = docRef.id;
    console.log(`✅ Vacation request saved to Firebase with ID: ${requestId}`);

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
        locale: locale // Use detected locale from request headers
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

 
