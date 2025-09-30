import { NextResponse } from 'next/server';
import { getRequestsWithConflicts } from '@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const requests = await getRequestsWithConflicts();
    
    // Test the filtering logic
    const pending = requests.filter(r => r.status?.toLowerCase() === 'pending');
    const reviewed = requests.filter(r => r.status?.toLowerCase() !== 'pending');
    
    return NextResponse.json({
      total: requests.length,
      pending: pending.length,
      reviewed: reviewed.length,
      pendingRequests: pending.map(r => ({ id: r.id, status: r.status })),
      reviewedRequests: reviewed.map(r => ({ id: r.id, status: r.status, reviewedAt: r.reviewedAt })),
      allStatuses: [...new Set(requests.map(r => r.status))]
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
