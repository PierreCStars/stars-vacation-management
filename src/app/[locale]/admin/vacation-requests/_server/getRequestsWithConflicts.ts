import { getFirebaseAdminDb } from '@/lib/firebase/index';

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
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    const dataPromise = fetchDataWithFallback();
    
    return await Promise.race([dataPromise, timeoutPromise]);
  } catch (error) {
    console.error('❌ Error in getRequestsWithConflicts:', error);
    return [];
  }
}

async function fetchDataWithFallback(): Promise<VacationRequestWithConflicts[]> {
  try {
    // 1) Get all vacation requests from Firestore
    const db = getFirebaseAdminDb();
    if (!db) {
      console.log('⚠️ Firebase Admin not available, falling back to API route');
      // Fallback to API route when Firebase Admin is not available
      try {
        const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        console.log(`🌐 Attempting API fallback to: ${baseUrl}/api/vacation-requests`);
        const response = await fetch(`${baseUrl}/api/vacation-requests`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Server-side: Got ${data.length} requests from API fallback`);
          // Convert API data to the expected format with conflicts
          return data.map((request: any) => ({
            ...request,
            conflicts: [] // No conflicts computed in API fallback
          }));
        } else {
          console.error(`❌ API fallback failed with status: ${response.status}`);
        }
      } catch (apiError) {
        console.error('❌ API fallback failed:', apiError);
      }
      console.log('⚠️ All fallbacks failed, returning empty array');
      return [];
    }
    
    const snapshot = await db.collection('vacationRequests').get();
    const allRequests = snapshot.docs.map(doc => {
      try {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Convert ALL Firestore timestamps to ISO strings safely
          reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt || null,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
        };
      } catch (error) {
        console.error('Error processing document:', doc.id, error);
        return {
          id: doc.id,
          ...doc.data(),
          reviewedAt: null,
          createdAt: null,
          updatedAt: null
        };
      }
    }) as any[];
    
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
              company: candidate.company || 'unknown',
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
        userEmail: 'test@example.com',
        userName: 'Test User',
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
            details: 'Overlap with Test User\'s VACATION from 2025-01-16 to 2025-01-16',
            conflictingRequests: [{
              id: 'mock-conflict-1',
              userName: 'Test User 2',
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
