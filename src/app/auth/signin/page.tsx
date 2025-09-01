'use client';

import { useSession } from 'next-auth/react';
import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import SignInButton from '@/components/SignInButton';
import { signIn } from 'next-auth/react';

const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview';

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
                  {isPreview ? 'Enter the preview credentials to continue' : 'Sign in with your Stars MC account to continue'}
                </p>
              </div>
              {isPreview ? (
                <PreviewCredentialsForm callbackUrl={callbackUrl} />
              ) : (
                <SignInButton callbackUrl={callbackUrl} />
              )}
            </Card>
          </div>
        </div>
      </main>
    </>
  );
}

function PreviewCredentialsForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    const res = await signIn('credentials', { username: email, password, callbackUrl, redirect: false });
    if (!res?.ok) setError('Invalid preview credentials');
    else window.location.href = callbackUrl;
  };

  return (
    <div className="space-y-3 text-left">
      <label className="block text-sm font-medium text-gray-700">Email</label>
      <input className="border p-2 w-full rounded" placeholder="Email" value={email} onChange={(e)=> setEmail(e.target.value)} />
      <label className="block text-sm font-medium text-gray-700">Password</label>
      <input className="border p-2 w-full rounded" type="password" placeholder="Password" value={password} onChange={(e)=> setPassword(e.target.value)} />
      <button className="px-3 py-2 border rounded w-full bg-blue-600 text-white" onClick={handleSubmit}>
        Sign in
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-gray-500">Preview environment only.</p>
    </div>
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