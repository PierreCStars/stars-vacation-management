import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, orderBy, limit, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ExternalEvent, SyncLog, SyncState } from '../calendar-sync-types';
import { randomUUID } from 'crypto';

// Collection names
const SYNC_STATE_COLLECTION = 'calendarSync';
const SYNC_LOGS_COLLECTION = 'calendarSyncLogs';
const EXTERNAL_EVENTS_COLLECTION = 'externalEvents';

// ---- Sync State (single row) ----
export async function getSyncState(): Promise<SyncState | null> {
  if (!db) return null;
  
  try {
    const docRef = doc(db, SYNC_STATE_COLLECTION, 'google_calendar_b');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as SyncState;
    }
    return null;
  } catch (error) {
    console.error('Error getting sync state:', error);
    return null;
  }
}

export async function upsertSyncState(patch: Partial<SyncState>): Promise<void> {
  if (!db) return;
  
  try {
    const docRef = doc(db, SYNC_STATE_COLLECTION, 'google_calendar_b');
    const existing = await getDoc(docRef);
    
    if (existing.exists()) {
      await updateDoc(docRef, {
        ...patch,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        id: 'google_calendar_b',
        ...patch,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error upserting sync state:', error);
  }
}

// ---- Sync Logs ----
export async function createSyncLog(): Promise<SyncLog> {
  const log: SyncLog = { 
    id: randomUUID(), 
    startedAt: new Date().toISOString(), 
    status: "running" 
  };
  
  if (db) {
    try {
      await setDoc(doc(db, SYNC_LOGS_COLLECTION, log.id), {
        ...log,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error creating sync log:', error);
    }
  }
  
  return log;
}

export async function finishSyncLog(id: string, patch: Partial<SyncLog>): Promise<void> {
  if (!db) return;
  
  try {
    const docRef = doc(db, SYNC_LOGS_COLLECTION, id);
    await updateDoc(docRef, {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error finishing sync log:', error);
  }
}

export async function getRecentSyncLogs(limitCount: number = 10): Promise<SyncLog[]> {
  if (!db) return [];
  
  try {
    const q = query(
      collection(db, SYNC_LOGS_COLLECTION),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SyncLog);
  } catch (error) {
    console.error('Error getting sync logs:', error);
    return [];
  }
}

// ---- External Events ----
export async function upsertExternalEvent(e: ExternalEvent): Promise<void> {
  if (!db) return;
  
  try {
    const docRef = doc(db, EXTERNAL_EVENTS_COLLECTION, e.externalEventId);
    const existing = await getDoc(docRef);
    
    if (existing.exists()) {
      await updateDoc(docRef, {
        ...e,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(docRef, {
        ...e,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error upserting external event:', error);
  }
}

export async function deleteExternalEventById(externalEventId: string): Promise<void> {
  if (!db) return;
  
  try {
    const docRef = doc(db, EXTERNAL_EVENTS_COLLECTION, externalEventId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting external event:', error);
  }
}

export async function getAllExternalEvents(): Promise<ExternalEvent[]> {
  if (!db) return [];
  
  try {
    const querySnapshot = await getDocs(collection(db, EXTERNAL_EVENTS_COLLECTION));
    return querySnapshot.docs.map(doc => doc.data() as ExternalEvent);
  } catch (error) {
    console.error('Error getting external events:', error);
    return [];
  }
}
