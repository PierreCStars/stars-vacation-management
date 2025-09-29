'use client';

import { useState } from 'react';
import { errorLogger } from '@/lib/error-logger';

export default function TestErrorPage() {
  const [errors, setErrors] = useState<any[]>([]);

  const triggerError = () => {
    try {
      // Simulate an error
      throw new Error('Test error for debugging');
    } catch (error) {
      const digest = errorLogger.logError(error as Error, {
        url: window.location.href,
        userAgent: window.navigator.userAgent,
      });
      console.log('Error logged with digest:', digest);
    }
  };

  const fetchErrors = async () => {
    try {
      const response = await fetch('/api/debug/error');
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    }
  };

  const checkSpecificError = async () => {
    const digest = '1523118523'; // The digest you mentioned
    try {
      const response = await fetch(`/api/debug/error?digest=${digest}`);
      const data = await response.json();
      console.log('Specific error:', data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to fetch specific error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Error Debugging Tools</h1>
        
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Test Error Logging</h2>
            <button
              onClick={triggerError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Trigger Test Error
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Check Specific Error</h2>
            <p className="text-sm text-gray-600 mb-4">
              Check for error with digest: 1523118523
            </p>
            <button
              onClick={checkSpecificError}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Check Error 1523118523
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Recent Errors</h2>
            <button
              onClick={fetchErrors}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mb-4"
            >
              Fetch Recent Errors
            </button>
            
            {errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Recent Errors ({errors.length})</h3>
                {errors.map((error, index) => (
                  <div key={index} className="p-3 bg-gray-100 rounded text-sm">
                    <div><strong>Digest:</strong> {error.digest}</div>
                    <div><strong>Message:</strong> {error.message}</div>
                    <div><strong>URL:</strong> {error.url}</div>
                    <div><strong>Time:</strong> {error.timestamp}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



