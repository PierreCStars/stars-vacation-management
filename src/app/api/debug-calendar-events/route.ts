import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationStatus } from '@/types/vacation-status';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
    }

    // Get all vacation requests
    const snapshot = await db.collection('vacationRequests').get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Array<{ id: string; status?: string; userName?: string; company?: string; startDate?: string; endDate?: string; [key: string]: any }>;
    
    console.log(`📊 Found ${requests.length} total vacation requests`);
    
    // Filter approved requests using normalization
    const approvedRequests = requests.filter(req => {
      const normalizedStatus = normalizeVacationStatus(req.status);
      return normalizedStatus === 'approved';
    });
    
    console.log(`✅ Found ${approvedRequests.length} approved requests`);
    
    // Create calendar events
    const firestoreEvents = approvedRequests.map(req => {
      return {
        id: `firestore_${req.id}`,
        summary: `${req.userName || 'Unknown'} - ${req.company || 'Unknown'}`,
        description: `Vacation Request\nName: ${req.userName || 'Unknown'}\nCompany: ${req.company || 'Unknown'}\nType: ${req.type || 'Full day'}\nReason: ${req.reason || 'N/A'}`,
        start: req.startDate,
        end: req.endDate,
        colorId: '2', // Green for approved vacation
        company: req.company || 'Unknown',
        userName: req.userName || 'Unknown',
        source: 'firestore',
        calendarEventId: req.calendarEventId || req.googleCalendarEventId
      };
    });

    return NextResponse.json({
      success: true,
      totalRequests: requests.length,
      approvedRequests: approvedRequests.length,
      firestoreEvents: firestoreEvents.length,
      events: firestoreEvents,
      debug: {
        allStatuses: requests.map(r => ({ id: r.id, status: r.status, normalized: normalizeVacationStatus(r.status) })),
        approvedStatuses: approvedRequests.map(r => ({ id: r.id, status: r.status, normalized: normalizeVacationStatus(r.status) }))
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
