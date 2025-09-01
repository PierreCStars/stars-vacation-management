import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { firebaseAdmin, isFirebaseAdminAvailable } from '@/lib/firebase-admin';
import { listEventsInRange } from '@/lib/google-calendar';

export const dynamic = 'force-dynamic';

interface ConflictRequest {
  id: string;
  company: string;
  start: string;
  end: string;
}

interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'same-company' | 'calendar-event';
    severity: 'low' | 'medium' | 'high';
    details: string;
    conflictingRequests?: Array<{
      id: string;
      userName: string;
      company: string;
      startDate: string;
      endDate: string;
      status: string;
    }>;
    calendarEvents?: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      location: string;
    }>;
  }>;
  summary: string;
}

export async function GET(request: NextRequest) {
  try {
    // Handle build-time scenario where request.url might be undefined
    if (!request.url) {
      return NextResponse.json({
        success: false,
        error: 'Request URL not available during build time',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    // Check authentication
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access
    if (!session.user.email.endsWith('@stars.mc')) {
      return NextResponse.json({ error: 'Access denied. Only @stars.mc users can access this endpoint.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const company = searchParams.get('company');
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!id || !company || !start || !end) {
      return NextResponse.json({ 
        error: 'Missing required parameters: id, company, start, end' 
      }, { status: 400 });
    }

    console.log('🔍 Checking conflicts for:', { id, company, start, end });

    const conflicts: ConflictResult['conflicts'] = [];
    let hasConflicts = false;

    // Check for same-company overlaps
    if (isFirebaseAdminAvailable()) {
      try {
        const { db } = firebaseAdmin();
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Query for overlapping requests from the same company
        const vacationRequestsRef = db.collection('vacationRequests');
        const q = vacationRequestsRef
          .where('company', '==', company)
          .where('status', 'in', ['pending', 'approved'])
          .limit(50);

        const querySnapshot = await q.get();
        const overlappingRequests = [];

        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (doc.id === id) return; // Skip current request

          const requestStart = new Date(data.startDate);
          const requestEnd = new Date(data.endDate);

          // Check for overlap: (A.start <= B.end) && (A.end >= B.start)
          const overlaps = startDate <= requestEnd && endDate >= requestStart;

          if (overlaps) {
            overlappingRequests.push({
              id: doc.id,
              userName: data.userName || 'Unknown',
              company: data.company,
              startDate: data.startDate,
              endDate: data.endDate,
              status: data.status || 'pending'
            });
          }
        });

        if (overlappingRequests.length > 0) {
          hasConflicts = true;
          const severity = overlappingRequests.length === 1 ? 'low' : 
                          overlappingRequests.length === 2 ? 'medium' : 'high';

          conflicts.push({
            type: 'same-company',
            severity,
            details: `${overlappingRequests.length} overlapping vacation request(s) from ${company}`,
            conflictingRequests: overlappingRequests
          });
        }
      } catch (error) {
        console.error('Error checking same-company conflicts:', error);
      }
    }

    // Check for source calendar event conflicts
    try {
      const sourceId = process.env.GOOGLE_CALENDAR_SOURCE_ID;
      if (sourceId) {
        const startISO = new Date(start).toISOString();
        const endISO = new Date(end).toISOString();
        
        const events = await listEventsInRange(sourceId, startISO, endISO);
        
        // Filter events that overlap with the vacation request
        const overlappingEvents = events
          .map(ev => {
            const es = ev.start?.date ? 
              new Date(`${ev.start.date}T00:00:00Z`) : 
              new Date(ev.start?.dateTime || '');
            const eeRaw = ev.end?.date ? 
              new Date(`${ev.end.date}T00:00:00Z`) : 
              new Date(ev.end?.dateTime || '');
            const ee = ev.end?.date ? 
              new Date(eeRaw.getTime() - 86400000) : // inclusive end for all-day events
              eeRaw;
            
            return { 
              id: ev.id, 
              title: ev.summary || '(Untitled)', 
              start: es, 
              end: ee, 
              location: ev.location || '' 
            };
          })
          .filter(ev => {
            const reqStart = new Date(start);
            const reqEnd = new Date(end);
            return ev.start <= reqEnd && ev.end >= reqStart;
          })
          .map(ev => ({
            id: ev.id || '',
            title: ev.title,
            startDate: ev.start.toISOString().slice(0, 10),
            endDate: ev.end.toISOString().slice(0, 10),
            location: ev.location
          }));

        if (overlappingEvents.length > 0) {
          hasConflicts = true;
          const severity = overlappingEvents.length === 1 ? 'low' : 
                          overlappingEvents.length === 2 ? 'medium' : 'high';

          conflicts.push({
            type: 'calendar-event',
            severity,
            details: `${overlappingEvents.length} company event(s) conflict with vacation dates`,
            calendarEvents: overlappingEvents
          });
        }
      }
    } catch (error) {
      console.error('Error checking source calendar conflicts:', error);
    }

    // Determine overall severity
    let overallSeverity: 'low' | 'medium' | 'high' = 'low';
    if (conflicts.some(c => c.severity === 'high')) {
      overallSeverity = 'high';
    } else if (conflicts.some(c => c.severity === 'medium')) {
      overallSeverity = 'medium';
    }

    const summary = hasConflicts 
      ? `Found ${conflicts.length} conflict type(s) with ${overallSeverity} severity`
      : 'No conflicts detected';

    const result: ConflictResult = {
      hasConflicts,
      conflicts,
      summary
    };

    console.log(`✅ Conflict check complete: ${summary}`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Error in conflict detection API:', error);
    return NextResponse.json({ 
      error: 'Internal server error during conflict detection' 
    }, { status: 500 });
  }
}
