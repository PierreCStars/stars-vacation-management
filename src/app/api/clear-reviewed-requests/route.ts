import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, query, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (pierre@stars.mc, compta@stars.mc)
    if (session.user.email !== 'pierre@stars.mc' && session.user.email !== 'compta@stars.mc') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    console.log('🗑️ Clearing reviewed vacation requests...');
    console.log('👤 Admin user:', session.user.email);

    // Get all vacation requests
    const vacationRequestsRef = collection(db, 'vacationRequests');
    const snapshot = await getDocs(vacationRequestsRef);

    if (snapshot.empty) {
      console.log('📋 No vacation requests found to clear');
      return NextResponse.json({ message: 'No vacation requests found to clear' });
    }

    // Filter for reviewed requests (status !== 'PENDING')
    const reviewedRequests = snapshot.docs.filter(doc => {
      const data = doc.data();
      return data.status !== 'PENDING';
    });

    if (reviewedRequests.length === 0) {
      console.log('📋 No reviewed requests found to clear');
      return NextResponse.json({ message: 'No reviewed requests found to clear' });
    }

    console.log(`🗑️ Found ${reviewedRequests.length} reviewed requests to delete`);

    // Delete all reviewed requests
    const batch = writeBatch(db);
    reviewedRequests.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${reviewedRequests.length} reviewed requests`);

    return NextResponse.json({ 
      message: `Successfully cleared ${reviewedRequests.length} reviewed requests`,
      deletedCount: reviewedRequests.length
    });

  } catch (error) {
    console.error('❌ Error clearing reviewed requests:', error);
    return NextResponse.json(
      { error: 'Failed to clear reviewed requests' },
      { status: 500 }
    );
  }
} 