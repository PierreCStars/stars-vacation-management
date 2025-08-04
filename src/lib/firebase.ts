import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Initialize Firebase authentication (with error handling)
export async function initializeFirebaseAuth() {
  try {
    // Check if user is already signed in
    const user = auth.currentUser;
    if (!user) {
      await signInAnonymously(auth);
      console.log('✅ Firebase anonymous auth initialized');
    } else {
      console.log('✅ Firebase auth already initialized');
    }
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    // Don't throw error - let the app continue without auth for now
    console.log('⚠️  Continuing without Firebase authentication');
  }
}

// Wait for authentication to be ready (with fallback)
export async function ensureAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        // Don't reject - just resolve with null to continue
        console.log('⚠️  No Firebase auth user, continuing without authentication');
        resolve(null);
      }
    });
  });
}

// Collection names
const VACATION_REQUESTS_COLLECTION = 'vacationRequests';

// Vacation Request interface
export interface VacationRequest {
  id?: string;
  userId: string;
  userEmail: string; // Add user email field
  userName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company: string;
  type: string;
  status: string;
  createdAt: string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  adminComment?: string;
  googleCalendarEventId?: string;
}

// Load all vacation requests from Firestore
export async function loadVacationRequests(): Promise<VacationRequest[]> {
  try {
    console.log('🔧 Loading vacation requests from Firestore...');
    
    // Try to ensure auth, but continue if it fails
    try {
      await ensureAuth();
    } catch (error) {
      console.log('⚠️  Auth failed, continuing without authentication');
    }
    
    const q = query(
      collection(db, VACATION_REQUESTS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: VacationRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        userId: data.userId || '',
        userEmail: data.userEmail || data.userId || '', // Use userEmail or fallback to userId
        userName: data.userName || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        reason: data.reason || '',
        company: data.company || '',
        type: data.type || '',
        status: data.status || '',
        createdAt: data.createdAt || '',
        reviewedBy: data.reviewedBy || '',
        reviewerEmail: data.reviewerEmail || '',
        reviewedAt: data.reviewedAt || '',
        adminComment: data.adminComment || '',
      });
    });
    
    console.log(`✅ Loaded ${requests.length} vacation requests from Firestore`);
    return requests;
  } catch (error) {
    console.error('❌ Error loading vacation requests from Firestore:', error);
    throw error;
  }
}

// Add a new vacation request to Firestore
export async function addVacationRequest(request: Omit<VacationRequest, 'id'>): Promise<string> {
  try {
    console.log('🔧 Adding vacation request to Firestore...');
    
    // Try to ensure auth, but continue if it fails
    try {
      await ensureAuth();
    } catch (error) {
      console.log('⚠️  Auth failed, continuing without authentication');
    }
    
    const docRef = await addDoc(collection(db, VACATION_REQUESTS_COLLECTION), {
      ...request,
      createdAt: serverTimestamp(),
    });
    
    console.log(`✅ Vacation request added to Firestore with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error adding vacation request to Firestore:', error);
    throw error;
  }
}

// Update a vacation request in Firestore
export async function updateVacationRequest(id: string, updates: Partial<VacationRequest>): Promise<void> {
  try {
    console.log(`🔧 Updating vacation request ${id} in Firestore...`);
    
    const docRef = doc(db, VACATION_REQUESTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      ...(updates.status === 'APPROVED' || updates.status === 'REJECTED' ? {
        reviewedAt: serverTimestamp(),
      } : {}),
    });
    
    console.log(`✅ Vacation request ${id} updated in Firestore`);
  } catch (error) {
    console.error(`❌ Error updating vacation request ${id} in Firestore:`, error);
    throw error;
  }
}

// Update vacation request status
export async function updateVacationRequestStatus(
  id: string,
  status: string,
  comment?: string,
  reviewerName?: string,
  reviewerEmail?: string
): Promise<void> {
  const updates: Partial<VacationRequest> = { status };
  
  if (comment) {
    updates.adminComment = comment;
  }
  
  if (status === 'APPROVED' || status === 'REJECTED') {
    updates.reviewedBy = reviewerName || 'Unknown';
    updates.reviewerEmail = reviewerEmail || '';
  }
  
  return await updateVacationRequest(id, updates);
}

// Get all vacation requests (for admin pages)
export async function getAllVacationRequests(): Promise<VacationRequest[]> {
  return await loadVacationRequests();
}

// Get vacation requests for a specific user
export async function getUserVacationRequests(userId: string): Promise<VacationRequest[]> {
  try {
    console.log(`🔧 Loading vacation requests for user ${userId} from Firestore...`);
    
    const q = query(
      collection(db, VACATION_REQUESTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requests: VacationRequest[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      requests.push({
        id: doc.id,
        userId: data.userId || '',
        userEmail: data.userEmail || data.userId || '', // Use userEmail or fallback to userId
        userName: data.userName || '',
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        reason: data.reason || '',
        company: data.company || '',
        type: data.type || '',
        status: data.status || '',
        createdAt: data.createdAt || '',
        reviewedBy: data.reviewedBy || '',
        reviewerEmail: data.reviewerEmail || '',
        reviewedAt: data.reviewedAt || '',
        adminComment: data.adminComment || '',
      });
    });
    
    console.log(`✅ Loaded ${requests.length} vacation requests for user ${userId} from Firestore`);
    return requests;
  } catch (error) {
    console.error(`❌ Error loading vacation requests for user ${userId} from Firestore:`, error);
    throw error;
  }
}

// Delete a vacation request (if needed)
export async function deleteVacationRequest(id: string): Promise<void> {
  try {
    console.log(`🔧 Deleting vacation request ${id} from Firestore...`);
    
    const docRef = doc(db, VACATION_REQUESTS_COLLECTION, id);
    await deleteDoc(docRef);
    
    console.log(`✅ Vacation request ${id} deleted from Firestore`);
  } catch (error) {
    console.error(`❌ Error deleting vacation request ${id} from Firestore:`, error);
    throw error;
  }
}

export { db }; 