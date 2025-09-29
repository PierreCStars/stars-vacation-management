'use client';

import { initializeApp, getApps } from 'firebase/app';
import { useEffect, useState } from 'react';

export default function DebugEnvPage() {
  const [isDevelopment, setIsDevelopment] = useState(false);
  
  useEffect(() => {
    setIsDevelopment(process.env.NODE_ENV === 'development');
  }, []);

  if (!isDevelopment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Debug Page Not Available</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
        </div>
      </div>
    );
  }
  // Collect all NEXT_PUBLIC_* environment variables (available at build time)
  const publicEnvVars: Record<string, string | undefined> = {};
  
  // Get all environment variables that start with NEXT_PUBLIC_
  Object.keys(process.env).forEach(key => {
    if (key.startsWith('NEXT_PUBLIC_')) {
      publicEnvVars[key] = process.env[key];
    }
  });
  
  // Try to initialize Firebase to get projectId
  let firebaseApp: any = null;
  try {
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
    
    const apps = getApps();
    if (apps.length > 0) {
      firebaseApp = apps[0];
    } else if (firebaseConfig.apiKey && firebaseConfig.projectId) {
      firebaseApp = initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }

  const getStatusIcon = (value: string | undefined) => {
    return value ? '✅' : '❌';
  };

  const getStatusText = (value: string | undefined) => {
    return value ? 'DEFINED' : 'UNDEFINED';
  };

  const maskApiKey = (key: string, value: string | undefined) => {
    if (!value) return value;
    if (key.includes('API_KEY')) {
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
    }
    return value;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔍 Environment Debug Page
          </h1>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-900 mb-2">App Information</h2>
            <p className="text-blue-800">
              <strong>Process CWD:</strong> {typeof window !== 'undefined' ? window.location.origin : 'Server-side'}
            </p>
            <p className="text-blue-800">
              <strong>NODE_ENV:</strong> {process.env.NODE_ENV}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Firebase Configuration
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getStatusIcon(process.env.NEXT_PUBLIC_ENABLE_FIREBASE)}</span>
                  <div>
                    <p className="font-medium">NEXT_PUBLIC_ENABLE_FIREBASE</p>
                    <p className="text-sm text-gray-600">
                      {getStatusText(process.env.NEXT_PUBLIC_ENABLE_FIREBASE)}: {process.env.NEXT_PUBLIC_ENABLE_FIREBASE || 'undefined'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getStatusIcon(firebaseApp?.options?.projectId)}</span>
                  <div>
                    <p className="font-medium">Firebase Project ID</p>
                    <p className="text-sm text-gray-600">
                      {getStatusText(firebaseApp?.options?.projectId)}: {firebaseApp?.options?.projectId || 'undefined'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              NEXT_PUBLIC_* Environment Variables
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {Object.entries(publicEnvVars).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-white rounded border">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getStatusIcon(value)}</span>
                      <span className="font-mono text-sm font-medium">{key}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {getStatusText(value)}
                      </p>
                      <p className="text-xs text-gray-600 font-mono">
                        {maskApiKey(key, value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Firebase App Details
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {firebaseApp ? (
                <div className="space-y-2">
                  <p><strong>App Name:</strong> {firebaseApp.name}</p>
                  <p><strong>Project ID:</strong> {firebaseApp.options.projectId}</p>
                  <p><strong>Auth Domain:</strong> {firebaseApp.options.authDomain}</p>
                  <p><strong>Storage Bucket:</strong> {firebaseApp.options.storageBucket}</p>
                  <p><strong>Messaging Sender ID:</strong> {firebaseApp.options.messagingSenderId}</p>
                  <p><strong>App ID:</strong> {firebaseApp.options.appId}</p>
                </div>
              ) : (
                <p className="text-red-600">❌ Firebase app not initialized</p>
              )}
            </div>
          </div>

          <div className="text-center">
            <a 
              href="/" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}