'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import VacationAnalytics from '@/components/VacationAnalytics';
// import Navigation from '@/components/Navigation';
import PageHeader from '@/components/ui/PageHeader';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/');
      return;
    }

    // Check if user has admin access for analytics
    const isAdmin = session.user.email === 'johnny@stars.mc' || 
                    session.user.email === 'daniel@stars.mc' || 
                    session.user.email === 'pierre@stars.mc' || 
                    session.user.email === 'compta@stars.mc';

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!session?.user?.email) {
    return null;
  }

  // Check if user has admin access
  const isAdmin = session.user.email === 'johnny@stars.mc' || 
                  session.user.email === 'daniel@stars.mc' || 
                  session.user.email === 'pierre@stars.mc' || 
                  session.user.email === 'compta@stars.mc';

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* <Navigation /> */}
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader 
            title="Vacation Analytics Dashboard"
            description="Comprehensive insights into vacation patterns, company trends, and employee statistics"
          />
          
          <VacationAnalytics />
        </div>
      </main>
    </>
  );
}
