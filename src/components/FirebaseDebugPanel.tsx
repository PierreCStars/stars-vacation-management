'use client';

import React, { useState, useEffect } from 'react';
import { isFirebaseEnabled, getFirebase } from '@/lib/firebase/index';

interface DiagnosticsData {
  nodeEnv: string;
  firebaseEnabled: boolean;
  projectId?: string;
  currentUser?: {
    uid: string;
    email?: string;
    isAnonymous: boolean;
  };
  lastError?: string;
  timestamp: string;
}

export default function FirebaseDebugPanel() {
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
        const data: DiagnosticsData = {
          nodeEnv: process.env.NODE_ENV || 'unknown',
          firebaseEnabled: isFirebaseEnabled(),
          timestamp: new Date().toISOString(),
        };

        if (data.firebaseEnabled) {
          try {
            const firebase = getFirebase();
            if (firebase && firebase.app) {
              data.projectId = firebase.app.options.projectId;

              // Try to get current user
              if (firebase.auth) {
                const user = firebase.auth.currentUser;
                
                if (user) {
                  data.currentUser = {
                    uid: user.uid,
                    email: user.email || undefined,
                    isAnonymous: user.isAnonymous,
                  };
                }
              }
            }
          } catch (error) {
            data.lastError = error instanceof Error ? error.message : 'Unknown error';
          }
        }

        setDiagnostics(data);
      } catch (error) {
        setDiagnostics({
          nodeEnv: process.env.NODE_ENV || 'unknown',
          firebaseEnabled: false,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
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
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-mono"
        >
          🔧 Loading...
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-mono hover:bg-blue-600 transition-colors"
      >
        🔧 Diagnostics
      </button>
      
      {isOpen && diagnostics && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm">Firebase Diagnostics</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-1">
              <div>
                <span className="text-gray-600">NODE_ENV:</span>
                <span className={`ml-2 px-1 rounded ${
                  diagnostics.nodeEnv === 'development' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {diagnostics.nodeEnv}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Firebase Enabled:</span>
                <span className={`ml-2 px-1 rounded ${
                  diagnostics.firebaseEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {diagnostics.firebaseEnabled ? 'true' : 'false'}
                </span>
              </div>
              
              {diagnostics.projectId && (
                <div>
                  <span className="text-gray-600">Project ID:</span>
                  <span className="ml-2 text-gray-800 break-all">{diagnostics.projectId}</span>
                </div>
              )}
              
              {diagnostics.currentUser && (
                <div>
                  <span className="text-gray-600">Current User:</span>
                  <div className="ml-2 space-y-1">
                    <div>UID: {diagnostics.currentUser.uid}</div>
                    {diagnostics.currentUser.email && (
                      <div>Email: {diagnostics.currentUser.email}</div>
                    )}
                    <div>Anonymous: {diagnostics.currentUser.isAnonymous ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              )}
              
              {diagnostics.lastError && (
                <div>
                  <span className="text-gray-600">Last Error:</span>
                  <div className="ml-2 text-red-600 break-all">{diagnostics.lastError}</div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <span className="text-gray-500">Updated: {new Date(diagnostics.timestamp).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris' })}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}