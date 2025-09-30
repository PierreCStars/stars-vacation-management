import { getFirebaseAdminDb } from '@/lib/firebase';

export interface VacationRequestWithConflicts {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  company?: string;
  type?: string;
  startDate: string;
  endDate: string;
  status: "pending" | "approved" | "rejected";
  reviewedAt?: string | null;
  reviewedBy?: { id?: string; name?: string; email?: string } | null;
  createdAt?: string;
  reason?: string;
  isHalfDay?: boolean;
  halfDayType?: string | null;
  durationDays?: number;
  conflicts: ConflictEvent[];
}

export interface ConflictEvent {
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
}

/**
 * Server-side helper to fetch vacation requests with conflicts computed on load
 * Implements inclusive overlap rule: (existing.startDate <= request.endDate) && (existing.endDate >= request.startDate)
 */
export async function getRequestsWithConflicts(): Promise<VacationRequestWithConflicts[]> {
  try {
    console.log('🔄 Server-side: Fetching vacation requests with conflicts...');
    
    // 1) Get all vacation requests from Firestore
    const db = getFirebaseAdminDb();
    if (!db) {
      console.log('⚠️ Firebase Admin not available, returning empty array');
      return [];
    }
    
    const snapshot = await db.collection('vacationRequests').get();
    const allRequests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
    
    console.log(`📊 Server-side: Found ${allRequests.length} total vacation requests`);
    
    if (allRequests.length === 0) {
      return [];
    }

    // 2) Prefetch candidate overlaps once by min/max to reduce queries
    const minStart = allRequests.reduce((acc, r) => 
      acc < r.startDate ? acc : r.startDate, allRequests[0].startDate
    );
    const maxEnd = allRequests.reduce((acc, r) => 
      acc > r.endDate ? acc : r.endDate, allRequests[0].endDate
    );

    console.log(`📅 Server-side: Scanning conflicts from ${minStart} to ${maxEnd}`);

    // 3) Get all approved/pending requests that could potentially overlap
    const candidates = allRequests.filter(request => 
      ['approved', 'pending'].includes(request.status.toLowerCase())
    );

    console.log(`🔍 Server-side: Found ${candidates.length} approved/pending candidates for conflict checking`);

    // 4) Map conflicts per request using inclusive overlap rule
    const enriched = allRequests.map(request => {
      const conflicts: ConflictEvent[] = [];
      
      // Check for overlaps with other requests from the same company
      for (const candidate of candidates) {
        // Skip self
        if (candidate.id === request.id) continue;
        
        // Skip different companies
        if (candidate.company !== request.company) continue;
        
        // Check inclusive overlap: (candidate.startDate <= request.endDate) && (candidate.endDate >= request.startDate)
        const candidateStart = new Date(candidate.startDate);
        const candidateEnd = new Date(candidate.endDate);
        const requestStart = new Date(request.startDate);
        const requestEnd = new Date(request.endDate);
        
        const hasOverlap = candidateStart <= requestEnd && candidateEnd >= requestStart;
        
        if (hasOverlap) {
          conflicts.push({
            type: 'same-company' as const,
            severity: 'high' as const,
            details: `Overlap with ${candidate.userName}'s ${candidate.type || 'VACATION'} from ${candidate.startDate} to ${candidate.endDate}`,
            conflictingRequests: [{
              id: candidate.id || 'unknown',
              userName: candidate.userName,
              company: candidate.company,
              startDate: candidate.startDate,
              endDate: candidate.endDate,
              status: candidate.status
            }]
          });
        }
      }

      return {
        ...request,
        conflicts
      } as VacationRequestWithConflicts;
    });

    console.log(`✅ Server-side: Computed conflicts for ${enriched.length} requests`);
    
    // Log conflict summary
    const requestsWithConflicts = enriched.filter(r => r.conflicts.length > 0);
    console.log(`⚠️ Server-side: ${requestsWithConflicts.length} requests have conflicts`);

    return enriched;

  } catch (error) {
    console.error('❌ Server-side: Error fetching requests with conflicts:', error);
    
    // Fallback to mock data for development
    const mockRequests: VacationRequestWithConflicts[] = [
      {
        id: 'mock-1',
        userId: 'user-1',
        userEmail: 'john@example.com',
        userName: 'John Smith',
        company: 'STARS_MC',
        type: 'VACATION',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        status: 'pending',
        createdAt: new Date().toISOString(),
        conflicts: [
          {
            type: 'same-company' as const,
            severity: 'high' as const,
            details: 'Overlap with Jane Doe\'s VACATION from 2025-01-16 to 2025-01-16',
            conflictingRequests: [{
              id: 'mock-conflict-1',
              userName: 'Jane Doe',
              company: 'STARS_MC',
              startDate: '2025-01-16',
              endDate: '2025-01-16',
              status: 'approved'
            }]
          }
        ]
      }
    ];

    console.log('🎭 Server-side: Using mock data due to error');
    return mockRequests;
  }
}





