'use client';
import React from 'react';
import { errorLogger } from '@/lib/error-logger';

export default function ErrorBoundary({ error, reset }: { error: any; reset: () => void }) {
  React.useEffect(() => {
    // Log error with comprehensive context
    const digest = errorLogger.logError(error, {
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    });

    // This shows in server logs in prod
    console.error('App Route ErrorBoundary', { 
      message: error?.message, 
      digest: digest,
      stack: error?.stack,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-4">
            We've logged this error and our team has been notified.
          </p>
          <div className="bg-gray-100 rounded-md p-3 mb-4">
            <p className="text-xs text-gray-500">
              Reference ID: <span className="font-mono">{String((error as any)?.digest || 'n/a')}</span>
            </p>
          </div>
          <div className="space-y-2">
            <button 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={() => reset()}
            >
              Try again
            </button>
            <button 
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              onClick={() => window.location.href = '/'}
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
