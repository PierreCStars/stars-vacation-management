import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  startAfter,
  serverTimestamp, 
  Firestore,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, Auth } from 'firebase/auth';

// Required Firebase environment variables
const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
] as const;

// Validate Firebase configuration
function validateFirebaseConfig(): { isValid: boolean; error?: string } {
  // Check if Firebase is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
    return { isValid: false, error: 'Firebase disabled - set NEXT_PUBLIC_ENABLE_FIREBASE=true to enable' };
  }

  // Check for missing variables
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    return { 
      isValid: false, 
      error: `Missing required Firebase environment variables: ${missing.join(', ')}` 
    };
  }
  
  // Check for placeholder values
  const placeholders = required.filter(key => {
    const value = process.env[key];
    return value && (
      value.includes('your_') ||
      value.includes('your-') ||
      value.includes('YOUR_') ||
      value.includes('YOUR-') ||
      value === 'your_project_id_here' ||
      value === 'your_api_key_here' ||
      value === 'your_sender_id_here' ||
      value === 'your_app_id_here' ||
      value === 'your_auth_domain_here' ||
      value === 'your_storage_bucket_here' ||
      value === 'your_messaging_sender_id_here' ||
      value === 'your_firebase_app_id_here' ||
      value.trim() === ''
    );
  });
  
  if (placeholders.length > 0) {
    return { 
      isValid: false, 
      error: `Firebase environment variables contain placeholder values: ${placeholders.join(', ')}. Please replace with actual Firebase configuration from Firebase Console → Project Settings → Web App` 
    };
  }
  
  return { isValid: true };
}

// Firebase configuration
let firebaseConfig: any = {};
let FIREBASE_ENABLED = false;
let initializationError: string | null = null;

// Initialize Firebase configuration
function initializeFirebaseConfig() {
  const validation = validateFirebaseConfig();
  
  if (!validation.isValid) {
    FIREBASE_ENABLED = false;
    initializationError = validation.error || 'Unknown configuration error';
    console.warn('⚠️', initializationError);
    return false;
  }

  try {
    firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    };
    FIREBASE_ENABLED = true;
    initializationError = null;
    return true;
  } catch (error) {
    FIREBASE_ENABLED = false;
    initializationError = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Firebase configuration error:', initializationError);
    return false;
  }
}

// Initialize configuration
initializeFirebaseConfig();

// Initialize Firebase only if enabled and properly configured
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;
let isInitialized = false;

function initializeFirebase() {
  if (isInitialized) {
    return { app, db, auth };
  }

  if (!FIREBASE_ENABLED) {
    console.log('ℹ️ Firebase disabled - set NEXT_PUBLIC_ENABLE_FIREBASE=true and configure Firebase env vars to enable');
    isInitialized = true;
    return { app: undefined, db: undefined, auth: undefined };
  }

  try {
    // Check if Firebase is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
      console.log('✅ Using existing Firebase app');
    } else {
      app = initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized successfully');
    }
    
    // Validate projectId after initialization
    const projectId = app.options.projectId;
    console.log('📊 Firebase projectId:', projectId);
    
    if (!projectId || projectId === 'your_project_id_here') {
      throw new Error(`Invalid Firebase projectId: "${projectId}". Check your environment variables.`);
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Anonymous auth for development only
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_ANON_AUTH === 'true') {
      // Initialize auth asynchronously after Firebase is set up
      setTimeout(async () => {
        try {
          const user = auth?.currentUser;
          if (!user) {
            console.log('🔐 Signing in anonymously for development...');
            await signInAnonymously(auth!);
            console.log('✅ Anonymous authentication successful');
          } else {
            console.log('✅ User already authenticated:', user.uid);
          }
        } catch (authError) {
          console.warn('⚠️ Anonymous authentication failed:', authError);
        }
      }, 100);
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.log('⚠️  Continuing without Firebase');
    FIREBASE_ENABLED = false;
    app = undefined;
    db = undefined;
    auth = undefined;
    isInitialized = true;
  }

  return { app, db, auth };
}

// Initialize Firebase
const { app: initializedApp, db: initializedDb, auth: initializedAuth } = initializeFirebase();
app = initializedApp;
db = initializedDb;
auth = initializedAuth;

// Vacation Request Types
export interface VacationRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason?: string;
  company: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
  createdAt?: Timestamp | string;
  updatedAt?: Timestamp | string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: Timestamp | string;
  adminComment?: string;
  googleEventId?: string;
}

// Collection names
const VACATION_REQUESTS_COLLECTION = 'vacationRequests';

// Helper function to convert Firestore timestamps to ISO strings
function convertTimestamps(data: any): any {
  if (!data) return data;
  
  const converted = { ...data };
  
  // Convert Firestore timestamps to ISO strings
  Object.keys(converted).forEach(key => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate().toISOString();
    }
  });
  
  return converted;
}

// Helper function to convert ISO strings to Firestore timestamps for writing
function prepareForFirestore(data: any): any {
  if (!data) return data;
  
  const prepared = { ...data };
  
  // Convert ISO strings to Firestore timestamps for date fields
  const dateFields = ['createdAt', 'updatedAt', 'reviewedAt'];
  dateFields.forEach(field => {
    if (prepared[field] && typeof prepared[field] === 'string') {
      prepared[field] = Timestamp.fromDate(new Date(prepared[field]));
    }
  });
  
  return prepared;
}

// Vacation Requests Data Layer
export class VacationRequestsService {
  private db: Firestore;

  constructor() {
    if (!db) {
      throw new Error('Firebase not initialized. Make sure Firebase is properly configured.');
    }
    this.db = db;
  }

  // Get all vacation requests
  async getAllVacationRequests(): Promise<VacationRequest[]> {
    try {
      const vacationRequestsRef = collection(this.db, VACATION_REQUESTS_COLLECTION);
      const q = query(vacationRequestsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as VacationRequest[];
    } catch (error) {
      console.error('Error fetching vacation requests:', error);
      throw new Error('Failed to fetch vacation requests');
    }
  }

  // Get vacation request by ID
  async getVacationRequestById(id: string): Promise<VacationRequest | null> {
    try {
      const docRef = doc(this.db, VACATION_REQUESTS_COLLECTION, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...convertTimestamps(docSnap.data())
        } as VacationRequest;
      }
      return null;
    } catch (error) {
      console.error('Error fetching vacation request:', error);
      throw new Error('Failed to fetch vacation request');
    }
  }

  // Get vacation requests by user email
  async getVacationRequestsByUser(userEmail: string): Promise<VacationRequest[]> {
    try {
      const vacationRequestsRef = collection(this.db, VACATION_REQUESTS_COLLECTION);
      const q = query(
        vacationRequestsRef, 
        where('userEmail', '==', userEmail),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as VacationRequest[];
    } catch (error) {
      console.error('Error fetching user vacation requests:', error);
      throw new Error('Failed to fetch user vacation requests');
    }
  }

  // Get vacation requests by status
  async getVacationRequestsByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<VacationRequest[]> {
    try {
      const vacationRequestsRef = collection(this.db, VACATION_REQUESTS_COLLECTION);
      const q = query(
        vacationRequestsRef, 
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as VacationRequest[];
    } catch (error) {
      console.error('Error fetching vacation requests by status:', error);
      throw new Error('Failed to fetch vacation requests by status');
    }
  }

  // Create new vacation request
  async createVacationRequest(request: Omit<VacationRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const vacationRequestsRef = collection(this.db, VACATION_REQUESTS_COLLECTION);
      const now = serverTimestamp();
      
      const newRequest = {
        ...request,
        createdAt: now,
        updatedAt: now
      };
      
      const docRef = await addDoc(vacationRequestsRef, newRequest);
      return docRef.id;
    } catch (error) {
      console.error('Error creating vacation request:', error);
      throw new Error('Failed to create vacation request');
    }
  }

  // Update vacation request
  async updateVacationRequest(id: string, updates: Partial<VacationRequest>): Promise<void> {
    try {
      const docRef = doc(this.db, VACATION_REQUESTS_COLLECTION, id);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Remove id from updates to avoid conflicts
      delete updateData.id;
      
      await updateDoc(docRef, prepareForFirestore(updateData));
    } catch (error) {
      console.error('Error updating vacation request:', error);
      throw new Error('Failed to update vacation request');
    }
  }

  // Delete vacation request
  async deleteVacationRequest(id: string): Promise<void> {
    try {
      const docRef = doc(this.db, VACATION_REQUESTS_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting vacation request:', error);
      throw new Error('Failed to delete vacation request');
    }
  }

  // Approve vacation request
  async approveVacationRequest(id: string, reviewedBy: string, reviewerEmail: string, adminComment?: string): Promise<void> {
    try {
      const docRef = doc(this.db, VACATION_REQUESTS_COLLECTION, id);
      const updateData: any = {
        status: 'approved', // Use lowercase canonical format
        reviewedBy,
        reviewerEmail,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only include adminComment if it's provided and not undefined
      if (adminComment !== undefined && adminComment !== null && adminComment !== '') {
        updateData.adminComment = adminComment;
      }
      
      console.log('[FIREBASE] approveVacationRequest', { id, status: 'approved', reviewedBy, reviewerEmail });
      await updateDoc(docRef, updateData);
      console.log('[FIREBASE] approveVacationRequest success', { id });
    } catch (error) {
      console.error('Error approving vacation request:', error);
      throw new Error('Failed to approve vacation request');
    }
  }

  // Reject vacation request
  async rejectVacationRequest(id: string, reviewedBy: string, reviewerEmail: string, adminComment?: string): Promise<void> {
    try {
      const docRef = doc(this.db, VACATION_REQUESTS_COLLECTION, id);
      const updateData: any = {
        status: 'denied', // Use 'denied' to match AdminPendingRequestsV2
        reviewedBy,
        reviewerEmail,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Only include adminComment if it's provided and not undefined
      if (adminComment !== undefined && adminComment !== null && adminComment !== '') {
        updateData.adminComment = adminComment;
      }
      
      console.log('[FIREBASE] rejectVacationRequest', { id, status: 'denied', reviewedBy, reviewerEmail });
      await updateDoc(docRef, updateData);
      console.log('[FIREBASE] rejectVacationRequest success', { id });
    } catch (error) {
      console.error('Error rejecting vacation request:', error);
      throw new Error('Failed to reject vacation request');
    }
  }

  // Get vacation requests with pagination
  async getVacationRequestsPaginated(
    limit: number = 10, 
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{ requests: VacationRequest[], lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
    try {
      const vacationRequestsRef = collection(this.db, VACATION_REQUESTS_COLLECTION);
      let q = query(vacationRequestsRef, orderBy('createdAt', 'desc'));
      
      if (startAfterDoc) {
        q = query(vacationRequestsRef, orderBy('createdAt', 'desc'), startAfter(startAfterDoc));
      }
      
      const snapshot = await getDocs(q);
      const requests = snapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...convertTimestamps(doc.data())
      })) as VacationRequest[];
      
      const lastDoc = snapshot.docs[limit - 1] || null;
      
      return { requests, lastDoc };
    } catch (error) {
      console.error('Error fetching paginated vacation requests:', error);
      throw new Error('Failed to fetch paginated vacation requests');
    }
  }
}

// Convenience function to get VacationRequestsService instance
export function getVacationRequestsService(): VacationRequestsService {
  if (!FIREBASE_ENABLED || !db) {
    throw new Error('Firebase not initialized. Make sure Firebase is properly configured.');
  }
  return new VacationRequestsService();
}

// Initialize Firebase authentication (with error handling)
export async function initializeFirebaseAuth() {
  if (!FIREBASE_ENABLED || !auth) {
    console.log('ℹ️ Firebase auth not available');
    return null;
  }

  try {
    // Check if user is already signed in
    const user = auth.currentUser;
    if (!user) {
      console.log('🔐 No current Firebase user, signing in anonymously...');
      await signInAnonymously(auth);
      console.log('✅ Firebase anonymous auth initialized');
    } else {
      console.log('✅ Firebase auth already initialized with user:', user.uid);
    }
    
    // Wait a moment for auth to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return auth.currentUser;
  } catch (error) {
    console.error('❌ Firebase auth error:', error);
    console.log('⚠️  Continuing without Firebase authentication');
    return null;
  }
}

// Wait for authentication to be ready (with fallback)
export async function ensureAuth() {
  if (!FIREBASE_ENABLED || !auth) {
    console.log('ℹ️ Firebase auth not available');
    return null;
  }

  return new Promise((resolve) => {
    if (!auth) {
      resolve(null);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        console.log('ℹ️ No Firebase auth user');
        resolve(null);
      }
    });
  });
}

// Collection names (already declared above)

// Load all vacation requests from Firestore
export async function loadVacationRequests(): Promise<VacationRequest[]> {
  try {
    console.log('🔧 Loading vacation requests from Firestore...');
    
    // Check if Firebase is available
    if (!FIREBASE_ENABLED || !db) {
      console.log('ℹ️ Firebase database not available');
      return [];
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
    
    // Check if Firebase is available
    if (!FIREBASE_ENABLED || !db) {
      console.log('ℹ️ Firebase database not available');
      throw new Error('Firebase not available');
    }
    
    const docRef = await addDoc(collection(db!, VACATION_REQUESTS_COLLECTION), {
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
    
    // Check if Firebase is available
    if (!FIREBASE_ENABLED || !db) {
      console.log('ℹ️ Firebase database not available');
      throw new Error('Firebase not available');
    }
    
    const docRef = doc(db, VACATION_REQUESTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...updates,
      ...(updates.status === 'approved' || updates.status === 'rejected' ? {
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
  status: 'pending' | 'approved' | 'rejected',
  comment?: string,
  reviewerName?: string,
  reviewerEmail?: string
): Promise<void> {
  const updates: Partial<VacationRequest> = { status };
  
  if (comment) {
    updates.adminComment = comment;
  }
  
  if (status === 'approved' || status === 'rejected') {
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
    
    // Check if Firebase is available
    if (!FIREBASE_ENABLED || !db) {
      console.log('ℹ️ Firebase database not available');
      return [];
    }
    
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
    
    // Check if Firebase is available
    if (!FIREBASE_ENABLED || !db) {
      console.log('ℹ️ Firebase database not available');
      throw new Error('Firebase not available');
    }
    
    const docRef = doc(db, VACATION_REQUESTS_COLLECTION, id);
    await deleteDoc(docRef);
    
    console.log(`✅ Vacation request ${id} deleted from Firestore`);
  } catch (error) {
    console.error(`❌ Error deleting vacation request ${id} from Firestore:`, error);
    throw error;
  }
}

// Safe export of Firebase instances (only if initialized)
export { db, auth, app, FIREBASE_ENABLED };

// Helper function to get Firebase app safely
export function getFirebaseApp(): FirebaseApp {
  const { app: currentApp } = initializeFirebase();
  if (!currentApp) {
    throw new Error('Firebase not initialized. Make sure Firebase is properly configured.');
  }
  return currentApp;
}

// Helper function to get Firestore instance safely
export function getFirestoreInstance(): Firestore {
  const { db: currentDb } = initializeFirebase();
  if (!currentDb) {
    throw new Error('Firestore not initialized. Make sure Firebase is properly configured.');
  }
  return currentDb;
}

// Helper function to check if Firebase is available
export function isFirebaseAvailable(): boolean {
  const { app: currentApp, db: currentDb, auth: currentAuth } = initializeFirebase();
  return !!(currentApp && currentDb && currentAuth);
}

// Get initialization error if any
export function getInitializationError(): string | null {
  return initializationError;
} 