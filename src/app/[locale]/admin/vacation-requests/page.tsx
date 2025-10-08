import { unstable_noStore } from 'next/cache';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getRequestsWithConflicts } from './_server/getRequestsWithConflicts';
import AdminVacationRequestsClient from './AdminVacationRequestsClient';
import { isPendingStatus, isReviewedStatus } from '@/types/vacation-status';
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
      <AdminPendingRequestsV2 />
    </div>
  );
}