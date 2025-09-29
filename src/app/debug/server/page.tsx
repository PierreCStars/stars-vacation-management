'use client';

import { useState, useEffect } from 'react';

export default function ServerDebugPage() {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServerInfo = async () => {
      try {
        // Test various endpoints to see which ones might be failing
        const endpoints = [
          '/api/health',
          '/api/debug/error',
          '/api/test-simple',
          '/api/test-firebase',
        ];

        const results = await Promise.allSettled(
          endpoints.map(async (endpoint) => {
            const response = await fetch(endpoint);
            const data = await response.json();
            return { endpoint, status: response.status, data };
          })
        );

        setServerInfo({
          timestamp: new Date().toISOString(),
          endpoints: results.map((result, index) => ({
            endpoint: endpoints[index],
            status: result.status === 'fulfilled' ? result.value.status : 'error',
            data: result.status === 'fulfilled' ? result.value.data : result.reason?.message,
            success: result.status === 'fulfilled'
          }))
        });
      } catch (error) {
        console.error('Failed to fetch server info:', error);
        setServerInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setLoading(false);
      }
    };

    fetchServerInfo();
  }, []);

  const testSpecificError = async () => {
    try {
      // Try to reproduce the error by testing various scenarios
      const tests = [
        () => fetch('/en/admin/vacation-requests'),
        () => fetch('/en/dashboard'),
        () => fetch('/api/health'),
        () => fetch('/api/debug/error?digest=1523118523'),
      ];

      for (const test of tests) {
        try {
          const response = await test();
          console.log(`✅ ${test.toString().split('(')[0]} - Status: ${response.status}`);
        } catch (error) {
          console.error(`❌ ${test.toString().split('(')[0]} - Error:`, error);
        }
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading server debug info...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Server Debug Information</h1>
        
        <div className="space-y-6">
          {/* Server Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Server Status</h2>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(serverInfo, null, 2)}
            </pre>
          </div>

          {/* Environment Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                'NODE_ENV',
                'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
                'FIREBASE_PROJECT_ID',
                'NEXTAUTH_URL',
                'NEXTAUTH_SECRET',
                'GOOGLE_CLIENT_ID',
                'GOOGLE_CLIENT_SECRET',
              ].map((key) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium">{key}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    process.env[key] ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {process.env[key] ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Testing */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Error Testing</h2>
            <div className="space-y-4">
              <button
                onClick={testSpecificError}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Test All Endpoints
              </button>
              
              <div className="text-sm text-gray-600">
                <p>This will test various endpoints to identify which one might be causing the error.</p>
                <p>Check the browser console for detailed results.</p>
              </div>
            </div>
          </div>

          {/* Specific Error Check */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Specific Error Investigation</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Error Digest: <code className="bg-gray-100 px-2 py-1 rounded">1523118523</code>
              </p>
              <p className="text-sm text-gray-600">
                This error digest was not found in the current session. It might be from:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>A previous session (error log is in-memory only)</li>
                <li>Production environment</li>
                <li>A different error source not captured by our error boundaries</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



