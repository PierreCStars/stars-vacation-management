import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';
import { normalizeVacationStatus } from '@/types/vacation-status';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      return NextResponse.json({ error: 'Firebase not available' }, { status: 500 });
    }

    const snapshot = await db.collection('vacationRequests').get();
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      status: doc.data().status,
      userName: doc.data().userName
    }));

    const approvedRequests = requests.filter(req => {
      const normalizedStatus = normalizeVacationStatus(req.status);
      return normalizedStatus === 'approved';
    });

    return NextResponse.json({
      total: requests.length,
      approved: approvedRequests.length,
      requests: requests.map(req => ({
        id: req.id,
        userName: req.userName,
        status: req.status,
        normalized: normalizeVacationStatus(req.status)
      })),
      approvedRequests: approvedRequests.map(req => ({
        id: req.id,
        userName: req.userName,
        status: req.status,
        normalized: normalizeVacationStatus(req.status)
      }))
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
