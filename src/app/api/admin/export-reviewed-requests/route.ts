import { NextResponse } from 'next/server';
import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export async function GET() {
  try {
    console.log('[CSV_EXPORT] Starting reviewed requests export...');
    
    const { db, error } = getFirebaseAdmin();
    if (error || !db) {
      console.error('[CSV_EXPORT] Firebase Admin not available:', error);
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Fetch all vacation requests
    const snapshot = await db.collection('vacationRequests').get();
    const allRequests = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings
        reviewedAt: data.reviewedAt?.toDate?.()?.toISOString() || data.reviewedAt || null,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt || null
      };
    }) as any[];

    // Filter only reviewed requests (non-pending)
    const reviewedRequests = allRequests.filter(r => r.status?.toLowerCase() !== 'pending');
    
    console.log(`[CSV_EXPORT] Found ${reviewedRequests.length} reviewed requests`);

    // Generate CSV content
    const csvHeaders = [
      'ID',
      'User Name',
      'User Email',
      'Company',
      'Type',
      'Start Date',
      'End Date',
      'Duration (Days)',
      'Half Day',
      'Half Day Type',
      'Reason',
      'Status',
      'Reviewer Email',
      'Reviewed By',
      'Reviewed At',
      'Admin Comment',
      'Created At',
      'Updated At'
    ];

    const csvRows = reviewedRequests.map(request => [
      request.id || '',
      request.userName || '',
      request.userEmail || '',
      request.company || '',
      request.type || '',
      request.startDate || '',
      request.endDate || '',
      request.durationDays || '',
      request.isHalfDay ? 'Yes' : 'No',
      request.halfDayType || '',
      request.reason || '',
      request.status || '',
      request.reviewerEmail || '',
      request.reviewedBy || '',
      request.reviewedAt || '',
      request.adminComment || '',
      request.createdAt || '',
      request.updatedAt || ''
    ]);

    // Escape CSV values (handle commas, quotes, newlines)
    const escapeCsvValue = (value: any) => {
      const stringValue = String(value || '');
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };

    const csvContent = [
      csvHeaders.map(escapeCsvValue).join(','),
      ...csvRows.map(row => row.map(escapeCsvValue).join(','))
    ].join('\n');

    console.log(`[CSV_EXPORT] Generated CSV with ${csvRows.length} rows`);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reviewed-vacation-requests-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('[CSV_EXPORT] Error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
