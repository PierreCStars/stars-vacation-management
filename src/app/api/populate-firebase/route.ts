import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export async function POST() {
  try {
    const { db, error } = getFirebaseAdmin();
    
    if (error || !db) {
      return NextResponse.json({ 
        success: false, 
        error: 'Firebase not available',
        details: error 
      }, { status: 500 });
    }

    console.log('🔥 Populating Firebase with test data...');

    // Test data
    const testData = [
      {
        userId: 'user-1',
        userEmail: 'pierre@stars.mc',
        userName: 'Pierre Corbucci',
        company: 'STARS_MC',
        type: 'VACATION',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        status: 'pending',
        reason: 'Family vacation',
        createdAt: new Date().toISOString(),
        durationDays: 3
      },
      {
        userId: 'user-2',
        userEmail: 'daniel@stars.mc',
        userName: 'Daniel Smith',
        company: 'STARS_MC',
        type: 'VACATION',
        startDate: '2025-01-20',
        endDate: '2025-01-22',
        status: 'approved',
        reason: 'Personal time off',
        createdAt: new Date().toISOString(),
        durationDays: 3,
        reviewedAt: new Date().toISOString(),
        reviewedBy: {
          name: 'Admin',
          email: 'admin@stars.mc'
        }
      },
      {
        userId: 'user-3',
        userEmail: 'johnny@stars.mc',
        userName: 'Johnny Doe',
        company: 'STARS_MC',
        type: 'SICK_LEAVE',
        startDate: '2025-01-25',
        endDate: '2025-01-25',
        status: 'denied',
        reason: 'Medical appointment',
        createdAt: new Date().toISOString(),
        durationDays: 1,
        reviewedAt: new Date().toISOString(),
        reviewedBy: {
          name: 'Admin',
          email: 'admin@stars.mc'
        }
      }
    ];

    // Clear existing data first
    const existingSnapshot = await db.collection('vacationRequests').get();
    console.log(`🗑️ Clearing ${existingSnapshot.docs.length} existing documents...`);
    
    const batch = db.batch();
    existingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Add test data
    const addedDocs = [];
    for (const data of testData) {
      const docRef = await db.collection('vacationRequests').add(data);
      addedDocs.push({ id: docRef.id, ...data });
      console.log(`✅ Added: ${data.userName} (${data.status})`);
    }

    return NextResponse.json({
      success: true,
      message: `Added ${addedDocs.length} test vacation requests to Firebase`,
      data: addedDocs
    });

  } catch (error) {
    console.error('❌ Error populating Firebase:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
