import { unstable_noStore } from 'next/cache';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getRequestsWithConflicts } from './_server/getRequestsWithConflicts';
import AdminVacationRequestsClient from './AdminVacationRequestsClient';
import { isPendingStatus, isReviewedStatus } from '@/types/vacation-status';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminVacationRequestsPage() {
  unstable_noStore(); // Ensure no caching

  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/en/login');
  }

  // Check if user is admin
  const adminEmails = process.env.NOTIFY_ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(session.user.email)) {
    redirect('/en/dashboard');
  }

  console.log('🔄 Server-side: Loading vacation requests with conflicts...');
  
  try {
    // Load vacation requests with conflicts
    const allRequests = await getRequestsWithConflicts();
    console.log(`✅ Server-side: Loaded ${allRequests.length} requests (${allRequests.filter(r => isPendingStatus(r.status)).length} pending, ${allRequests.filter(r => isReviewedStatus(r.status)).length} reviewed, ${allRequests.filter(r => r.conflicts?.length > 0).length} with conflicts)`);

    // Filter requests by status
    const pending = allRequests.filter(request => isPendingStatus(request.status));
    const reviewed = allRequests.filter(request => isReviewedStatus(request.status));
    const conflictCount = allRequests.filter(request => request.conflicts?.length > 0).length;

    // Get version info for debugging
    const version = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Debug banner */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="bg-yellow-100 border-b border-yellow-400 text-yellow-800 px-4 py-2 text-sm">
            🔧 DEBUG: Admin page loaded with {allRequests.length} requests, {pending.length} pending, {reviewed.length} reviewed
          </div>
        )}
        
        <AdminVacationRequestsClient
          initialRequests={allRequests}
          pending={pending}
          reviewed={reviewed}
          conflictCount={conflictCount}
          version={version}
        />
      </div>
    );
  } catch (error) {
    console.error('❌ Server-side: Failed to load vacation requests:', error);
    
    // Fallback to empty state
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading vacation requests
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Unable to load vacation requests. Please try refreshing the page.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}