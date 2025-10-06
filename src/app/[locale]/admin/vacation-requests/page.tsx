import Link from 'next/link';
import { getRequestsWithConflicts, VacationRequestWithConflicts } from './_server/getRequestsWithConflicts';
import { loadVacationRequests } from './_data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import UnifiedVacationCalendar from "@/components/UnifiedVacationCalendar";
import ConflictDetailsDrawer from "@/components/ConflictDetailsDrawer";
import FirebaseDebugPanel from "@/components/FirebaseDebugPanel";
import FirebaseDiagnostics from "@/components/FirebaseDiagnostics";
import { isFirebaseEnabled } from "@/lib/firebase/client";
import AdminVacationRequestsClient from './AdminVacationRequestsClient';
import { normalizeStatus, isPendingStatus, isReviewedStatus } from '@/types/vacation-status';

export default async function AdminVacationRequestsPage() {
  try {
    // Server-side: Fetch vacation requests with conflicts computed on load
    console.log('🔄 Server-side: Loading vacation requests with conflicts...');
    
    // First, test basic data loading
    console.log('[VACATION_REQUESTS] Testing basic data load...');
    let basicRequests: any[] = [];
    try {
      basicRequests = await loadVacationRequests();
      console.log(`[VACATION_REQUESTS] Basic load successful: ${basicRequests.length} requests`);
    } catch (basicError) {
      console.error('[VACATION_REQUESTS] Basic load failed:', basicError);
    }
    
    // Then get full data with conflicts
    console.log('[VACATION_REQUESTS] Getting requests with conflicts...');
    let requests: any[] = [];
    try {
      requests = await getRequestsWithConflicts();
      console.log(`[VACATION_REQUESTS] Got ${requests.length} requests with conflicts`);
    } catch (conflictError) {
      console.error('[VACATION_REQUESTS] Conflict check failed:', conflictError);
      // Fallback to basic requests if conflict check fails
      requests = basicRequests;
    }
    
    // If we still have no data, try API fallback
    if (requests.length === 0) {
      console.log('[VACATION_REQUESTS] No data from server-side, trying API fallback...');
      try {
        const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || process.env.VERCEL_URL || '';
        const response = await fetch(`${baseUrl}/api/vacation-requests`, { cache: 'no-store' });
        if (response.ok) {
          requests = await response.json();
          console.log(`[VACATION_REQUESTS] API fallback successful: ${requests.length} requests`);
        }
      } catch (apiError) {
        console.error('[VACATION_REQUESTS] API fallback failed:', apiError);
      }
    }
    
    // Separate pending and reviewed requests (case-insensitive)
    console.log('[VACATION_REQUESTS] Filtering requests by status...');
    
    // Log all status values for debugging
    const statusCounts = requests.reduce((acc, r) => {
      const status = r.status?.toLowerCase() || 'undefined';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('[VACATION_REQUESTS] Status distribution:', statusCounts);
    
    const pending = requests.filter(r => {
      const isPending = isPendingStatus(r.status);
      if (isPending) {
        console.log('[VACATION_REQUESTS] Found pending request:', { id: r.id, status: r.status, userName: r.userName });
      }
      return isPending;
    });
    const reviewed = requests.filter(r => isReviewedStatus(r.status));
    
    // Count requests with conflicts
    console.log('[VACATION_REQUESTS] Counting conflicts...');
    const conflictCount = requests.filter(r => r.conflicts?.length > 0).length;
    
    console.log(`✅ Server-side: Loaded ${requests.length} requests (${pending.length} pending, ${reviewed.length} reviewed, ${conflictCount} with conflicts)`);

    return (
      <AdminVacationRequestsClient 
        initialRequests={requests}
        pending={pending}
        reviewed={reviewed}
        conflictCount={conflictCount}
      />
    );
  } catch (error) {
    console.error('VACATION_REQUESTS_RENDER_ERROR', error);
    console.error('❌ Server-side: Error loading vacation requests:', error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return a fallback UI that doesn't crash
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Data</h1>
            <p className="text-sm text-gray-600 mb-4">
              We're having trouble loading vacation requests. Please try refreshing the page.
            </p>
            <div className="text-xs text-gray-400 mb-4 p-2 bg-gray-100 rounded">
              Error: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
// Force cache clear 1759751218
