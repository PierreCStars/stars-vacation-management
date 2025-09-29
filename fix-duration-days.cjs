const { initializeApp, getApps } = require('firebase/app');
const { getFirestore, doc, getDocs, collection, updateDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function fixDurationDays() {
  try {
    console.log('🔧 Initializing Firebase...');
    
    // Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);
    
    console.log('📊 Fetching vacation requests...');
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const snapshot = await getDocs(vacationRequestsRef);
    
    console.log(`📋 Found ${snapshot.docs.length} vacation requests`);
    
    let fixedCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      const docRef = doc(db, 'vacationRequests', docSnapshot.id);
      
      // Check if durationDays is null or undefined
      if (data.durationDays === null || data.durationDays === undefined) {
        console.log(`🔧 Fixing vacation request ${docSnapshot.id}...`);
        
        // Calculate duration
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        const timeDiff = endDate.getTime() - startDate.getTime();
        let durationDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // For half days, set to 0.5
        if (data.isHalfDay) {
          durationDays = 0.5;
        }
        
        // Update the document
        await updateDoc(docRef, {
          durationDays: durationDays,
          isHalfDay: data.isHalfDay || false,
          halfDayType: data.halfDayType || null
        });
        
        console.log(`✅ Fixed ${docSnapshot.id}: durationDays = ${durationDays}, isHalfDay = ${data.isHalfDay || false}`);
        fixedCount++;
      }
    }
    
    console.log(`🎉 Fixed ${fixedCount} vacation requests`);
    
  } catch (error) {
    console.error('❌ Error fixing duration days:', error);
  }
}

fixDurationDays();
