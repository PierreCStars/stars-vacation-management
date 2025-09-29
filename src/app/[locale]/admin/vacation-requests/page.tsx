import Link from 'next/link';
import { getRequestsWithConflicts, VacationRequestWithConflicts } from './_server/getRequestsWithConflicts';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import UnifiedVacationCalendar from "@/components/UnifiedVacationCalendar";
import ConflictDetailsDrawer from "@/components/ConflictDetailsDrawer";
import FirebaseDebugPanel from "@/components/FirebaseDebugPanel";
import FirebaseDiagnostics from "@/components/FirebaseDiagnostics";
import { isFirebaseAvailable } from "@/lib/firebase";
import AdminVacationRequestsClient from './AdminVacationRequestsClient';
import ClientOnly from '@/components/ClientOnly';

export default async function AdminVacationRequestsPage() {
  try {
    // Server-side: Fetch vacation requests with conflicts computed on load
    console.log('🔄 Server-side: Loading vacation requests with conflicts...');
    const requests = await getRequestsWithConflicts();
    
    // Separate pending and reviewed requests
    const pending = requests.filter(r => r.status === 'pending');
    const reviewed = requests.filter(r => r.status !== 'pending');
    
    // Count requests with conflicts
    const conflictCount = requests.filter(r => r.conflicts.length > 0).length;
    
    console.log(`✅ Server-side: Loaded ${requests.length} requests (${pending.length} pending, ${reviewed.length} reviewed, ${conflictCount} with conflicts)`);

    return (
      <ClientOnly>
        <AdminVacationRequestsClient 
          initialRequests={requests}
          pending={pending}
          reviewed={reviewed}
          conflictCount={conflictCount}
        />
      </ClientOnly>
    );
  } catch (error) {
    console.error('❌ Server-side: Error loading vacation requests:', error);
    
    // Return a fallback UI that doesn't crash
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Data</h1>
            <p className="text-sm text-gray-600 mb-4">
              We're having trouble loading vacation requests. Please try refreshing the page.
            </p>
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
