import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';
import { mapFromFirestore } from '@/lib/requests/mapFromFirestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json({
        error: 'Firebase Admin not available',
        details: error
      }, { status: 500 });
    }

    // Get one vacation request document
    const snapshot = await db.collection('vacationRequests').limit(1).get();
    
    if (snapshot.empty) {
      return NextResponse.json({
        message: 'No vacation requests found',
        count: 0
      });
    }

    const doc = snapshot.docs[0];
    const rawData = doc.data();
    const mappedData = mapFromFirestore(doc.id, rawData);

    return NextResponse.json({
      message: 'Successfully fetched one vacation request',
      rawData: {
        id: doc.id,
        ...rawData,
        // Show timestamp types for debugging
        createdAtType: typeof rawData.createdAt,
        reviewedAtType: typeof rawData.reviewedAt,
        updatedAtType: typeof rawData.updatedAt,
      },
      mappedData,
      timestampInfo: {
        createdAt: rawData.createdAt?.toDate?.()?.toISOString() || rawData.createdAt,
        reviewedAt: rawData.reviewedAt?.toDate?.()?.toISOString() || rawData.reviewedAt,
        updatedAt: rawData.updatedAt?.toDate?.()?.toISOString() || rawData.updatedAt,
      }
    });

  } catch (error) {
    console.error('❌ Error in debug endpoint:', error);
    return NextResponse.json({
      error: 'Failed to fetch vacation request',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
