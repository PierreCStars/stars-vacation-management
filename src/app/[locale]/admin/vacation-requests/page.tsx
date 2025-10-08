import { unstable_noStore } from 'next/cache';
import AdminPendingRequestsV2 from '@/components/admin/AdminPendingRequestsV2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminVacationRequestsPage({ params }: { params: { locale: string } }) {
  unstable_noStore(); // Ensure no caching

  // Get commit hash for debugging
  const COMMIT = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';

  return (
    <div>
      <div data-test="commit" className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-mono">
        Commit: {COMMIT?.slice(0,7)}
      </div>
      <DebugBanner />
      <AdminPendingRequestsV2 />
    </div>
  );
}

// Temporary debug banner component
function DebugBanner() {
  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 mb-4">
      <div className="flex items-center">
        <div className="text-sm">
          <strong>Debug Mode:</strong> Check console for Firebase connection details
        </div>
      </div>
    </div>
  );
}