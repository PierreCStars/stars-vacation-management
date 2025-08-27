'use client';

import { useSession } from 'next-auth/react';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import SignInButton from '@/components/SignInButton';

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      router.push(callbackUrl);
    }
  }, [session, status, router, callbackUrl]);

  if (status === 'loading') {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex flex-col items-center justify-center py-12 bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
            <p className="text-gray-600">Please wait while we redirect you.</p>
          </div>
        </main>
      </>
    );
  }

  if (session?.user) {
    return null;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <PageHeader 
            title="Sign In"
          />

          {/* Sign In Card */}
          <div className="max-w-md mx-auto">
            <Card className="text-center">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                  Welcome Back
                </h2>
                <p className="text-gray-600 mb-6">
                  Sign in with your Stars MC account to continue
                </p>
              </div>
              <SignInButton callbackUrl={callbackUrl} />
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sign in page...</p>
        </div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
} 