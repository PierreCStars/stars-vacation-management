'use client';

import React, { useState, useEffect } from 'react';
import { isFirebaseEnabled, getFirebaseClient } from '@/lib/firebase/client';

interface DiagnosticsData {
  nodeEnv: string;
  firebaseEnabled: boolean;
  projectId?: string;
  envVars: {
    [key: string]: {
      present: boolean;
      isPlaceholder: boolean;
      value?: string;
    };
  };
  timestamp: string;
}

export default function FirebaseDiagnostics() {
  const [isOpen, setIsOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const gatherDiagnostics = async () => {
      try {
        const envVars = [
          'NEXT_PUBLIC_FIREBASE_API_KEY',
          'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
          'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
          'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
          'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
          'NEXT_PUBLIC_FIREBASE_APP_ID',
          'NEXT_PUBLIC_ENABLE_FIREBASE'
        ];

        const envVarStatus: { [key: string]: { present: boolean; isPlaceholder: boolean; value?: string } } = {};
        
        envVars.forEach(key => {
          const value = process.env[key];
          const present = !!value;
          const isPlaceholder = present && (
            value.includes('your_') || 
            value.includes('your-') ||
            value.includes('YOUR_') ||
            value.includes('YOUR-') ||
            value === 'your_project_id_here' ||
            value === 'your_api_key_here' ||
            value === 'your_sender_id_here' ||
            value === 'your_app_id_here'
          );
          
          envVarStatus[key] = {
            present,
            isPlaceholder,
            value: present ? (isPlaceholder ? value : '***hidden***') : undefined
          };
        });

        let projectId: string | undefined;
        try {
          if (isFirebaseEnabled()) {
            const firebase = getFirebaseClient();
            if (firebase && firebase.app) {
              projectId = firebase.app.options.projectId;
            }
          }
        } catch (error) {
          // Firebase not available
        }

        const data: DiagnosticsData = {
          nodeEnv: process.env.NODE_ENV || 'unknown',
          firebaseEnabled: isFirebaseEnabled(),
          projectId,
          envVars: envVarStatus,
          timestamp: new Date().toISOString()
        };

        setDiagnostics(data);
      } catch (error) {
        console.error('Error gathering diagnostics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    gatherDiagnostics();
  }, [mounted]);

  // Only show in development and after mount
  if (!mounted || process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
        >
          🔧 Loading Diagnostics...
        </button>
      </div>
    );
  }

  if (!diagnostics) {
    return null;
  }

  const hasPlaceholders = Object.values(diagnostics.envVars).some(v => v.isPlaceholder);
  const missingVars = Object.entries(diagnostics.envVars).filter(([_, status]) => !status.present);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 rounded-lg shadow-lg text-sm font-medium ${
          hasPlaceholders || missingVars.length > 0
            ? 'bg-red-500 text-white'
            : diagnostics.firebaseEnabled
            ? 'bg-green-500 text-white'
            : 'bg-yellow-500 text-white'
        }`}
      >
        🔧 Firebase Diagnostics
        {hasPlaceholders && ' ⚠️'}
        {missingVars.length > 0 && ' ❌'}
      </button>

      {isOpen && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Firebase Diagnostics</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Environment:</span>
                <span className={diagnostics.nodeEnv === 'development' ? 'text-green-600' : 'text-blue-600'}>
                  {diagnostics.nodeEnv}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="font-medium">Firebase Enabled:</span>
                <span className={diagnostics.firebaseEnabled ? 'text-green-600' : 'text-red-600'}>
                  {diagnostics.firebaseEnabled ? 'Yes' : 'No'}
                </span>
              </div>

              {diagnostics.projectId && (
                <div className="flex justify-between">
                  <span className="font-medium">Project ID:</span>
                  <span className="text-blue-600 font-mono text-xs">
                    {diagnostics.projectId}
                  </span>
                </div>
              )}

              <div className="border-t pt-2">
                <div className="font-medium text-gray-700 mb-2">Environment Variables:</div>
                {Object.entries(diagnostics.envVars).map(([key, status]) => (
                  <div key={key} className="flex justify-between items-center py-1">
                    <span className="text-xs font-mono text-gray-600">
                      {key.replace('NEXT_PUBLIC_', '')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      !status.present
                        ? 'bg-red-100 text-red-700'
                        : status.isPlaceholder
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {!status.present ? 'Missing' : status.isPlaceholder ? 'Placeholder' : 'OK'}
                    </span>
                  </div>
                ))}
              </div>

              {hasPlaceholders && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-800">
                  ⚠️ Some environment variables contain placeholder values. 
                  Please replace them with actual Firebase configuration values.
                </div>
              )}

              {missingVars.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                  ❌ Missing environment variables: {missingVars.map(([key]) => key.replace('NEXT_PUBLIC_', '')).join(', ')}
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                Last updated: {new Date(diagnostics.timestamp).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
