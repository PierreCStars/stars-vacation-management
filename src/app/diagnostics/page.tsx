'use client';

import { useEffect, useState } from 'react';

interface DiagnosticData {
  env: Record<string, boolean>;
  lastError?: {
    message: string;
    digest: string;
    timestamp: string;
  };
  health: any;
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      setData({
        env: {},
        health: { error: 'Diagnostics not available in production' }
      });
      setLoading(false);
      return;
    }

    const fetchDiagnostics = async () => {
      try {
        const healthResponse = await fetch('/api/health');
        const health = await healthResponse.json();
        
        setData({
          env: {
            hasGoogleId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            hasGoogleSecret: !!process.env.GOOGLE_CLIENT_SECRET,
            hasNextAuth: !!(process.env.NEXT_PUBLIC_NEXTAUTH_URL && process.env.NEXTAUTH_SECRET),
            hasFirebase: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_PROJECT_ID),
            hasGmail: !!(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
          },
          health
        });
      } catch (error) {
        console.error('Failed to fetch diagnostics:', error);
        setData({
          env: {},
          health: { error: 'Failed to fetch health data' }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnostics();
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Diagnostics Not Available</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">System Diagnostics</h1>
          
          <div className="space-y-6">
            {/* Environment Variables */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Environment Variables</h2>
              <div className="grid grid-cols-2 gap-4">
                {data?.env && Object.entries(data.env).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-700">{key}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? '✓' : '✗'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Health Check */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Health Check</h2>
              <div className="bg-gray-50 rounded p-4">
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(data?.health, null, 2)}
                </pre>
              </div>
            </div>

            {/* Runtime Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">Runtime Information</h2>
              <div className="bg-gray-50 rounded p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Node Environment:</span>
                    <span className="ml-2 text-gray-600">{process.env.NODE_ENV}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Runtime:</span>
                    <span className="ml-2 text-gray-600">Client</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Timestamp:</span>
                    <span className="ml-2 text-gray-600">{new Date().toISOString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



