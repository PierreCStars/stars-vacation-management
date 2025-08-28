import { db } from './firebase';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

export type ConflictHit = {
  id: string;
  userName: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  status: string;
};

function toStartOfDay(dateISO: string) {
  return new Date(dateISO + "T00:00:00");
}

function toEndOfDay(dateISO: string) {
  return new Date(dateISO + "T23:59:59");
}

// Overlap logic: (A.start <= B.end) && (A.end >= B.start)
export async function findVacationConflicts({
  startDateISO,
  endDateISO,
  excludeId,
}: {
  startDateISO: string;
  endDateISO: string;
  excludeId?: string;
}): Promise<ConflictHit[]> {
  try {
    // Check if Firebase is available
    if (!db) {
      console.error('Firebase database not available');
      return [];
    }

    // Import and ensure Firebase auth is initialized
    const { initializeFirebaseAuth } = await import('./firebase');
    await initializeFirebaseAuth();

    const startBound = toStartOfDay(startDateISO);
    const endBound = toEndOfDay(endDateISO);

    // Query by startDate <= endBound (index-friendly), then filter by endDate >= startBound
    // We'll use a broader query and filter in code since Firestore range queries are limited
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const q = query(
      vacationRequestsRef,
      where('status', 'in', ['pending', 'approved']),
      limit(200)
    );
    
    const querySnapshot = await getDocs(q);
    const list: ConflictHit[] = [];

    querySnapshot.forEach(doc => {
      const d = doc.data() as { 
        startDate?: string; 
        endDate?: string; 
        userName?: string; 
        userEmail?: string; 
        status?: string; 
      };
      if (excludeId && doc.id === excludeId) return;
      
      // Skip if no dates
      if (!d.startDate || !d.endDate) return;
      
      const requestStart = toStartOfDay(d.startDate);
      const requestEnd = toEndOfDay(d.endDate);
      
      // Check for overlap: (A.start <= B.end) && (A.end >= B.start)
      const overlaps = startBound <= requestEnd && endBound >= requestStart;
      
      if (overlaps) {
        list.push({
          id: doc.id,
          userName: d.userName || d.userEmail || "Unknown",
          startDate: d.startDate,
          endDate: d.endDate,
          status: d.status || "unknown",
        });
      }
    });

    return list;
  } catch (error) {
    console.error('Error finding vacation conflicts:', error);
    return [];
  }
}
