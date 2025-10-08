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

export default async function AdminVacationRequestsPage() {
  unstable_noStore(); // Ensure no caching

  // Get commit hash for debugging
  const COMMIT = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
    || process.env.VERCEL_GIT_COMMIT_SHA
    || 'dev';

  // Check authentication
  const session = await getServerSession(authOptions);
  console.log('🔐 Server-side session check:', { 
    hasSession: !!session, 
    hasUser: !!session?.user, 
    email: session?.user?.email,
    adminEmails: process.env.NOTIFY_ADMIN_EMAILS?.split(',') || []
  });
  
  if (!session?.user?.email) {
    console.log('❌ No session, redirecting to login');
    redirect('/en/login');
  }

  // Check if user is admin
  const adminEmails = process.env.NOTIFY_ADMIN_EMAILS?.split(',') || [];
  if (!adminEmails.includes(session.user.email)) {
    console.log('❌ User not admin, redirecting to dashboard');
    redirect('/en/dashboard');
  }
  
  console.log('✅ User authenticated as admin:', session.user.email);

  return (
    <div>
      <div data-test="commit" className="bg-blue-100 text-blue-800 px-2 py-1 text-xs font-mono">
        Commit: {COMMIT?.slice(0,7)}
      </div>
      <AdminPendingRequestsV2 />
    </div>
  );
}