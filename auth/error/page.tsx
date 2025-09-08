'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error');

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4" style={{ color: '#000000' }}>
            Authentication Error
          </h1>
          <p className="text-black mb-8" style={{ color: '#000000' }}>
            {error === 'AccessDenied' 
              ? 'Access denied. Please use your @stars.mc email address.'
              : 'An error occurred during authentication.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            style={{ paddingLeft: '24px', paddingRight: '24px' }}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4" style={{ color: '#000000' }}>Loading...</h1>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
} 