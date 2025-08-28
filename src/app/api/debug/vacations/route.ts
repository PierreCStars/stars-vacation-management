import { NextResponse } from "next/server";
import { firebaseAdmin, isFirebaseAdminAvailable } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    let latest = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db } = firebaseAdmin();
        const snap = await db.collection("vacationRequests").orderBy("createdAt", "desc").limit(5).get();
        latest = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
        console.log(`🔍 Debug: Found ${latest.length} latest requests in Firestore`);
      } else {
        console.log('⚠️  Debug: Firebase Admin not available');
      }
    } catch (firebaseError) {
      console.error('❌ Debug: Firebase error:', firebaseError);
    }

    // Also check temp storage if available
    let tempStorageInfo = "Not accessible from API route";
    
    return NextResponse.json({ 
      timestamp: new Date().toISOString(),
      firebaseAvailable: isFirebaseAdminAvailable(),
      latestFromFirestore: latest,
      tempStorageInfo,
      totalCount: latest.length
    });

  } catch (error) {
    console.error('❌ Error in debug route:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
