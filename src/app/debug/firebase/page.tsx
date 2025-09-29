'use client';

import { useEffect, useState } from 'react';
import { getFirebaseApp, isFirebaseAvailable, getFirestoreInstance, getAuthInstance } from '@/lib/firebase-client';
import { getVacationRequestsService } from '@/lib/firebase';

interface DebugInfo {
  timestamp: string;
  environment: {
    NODE_ENV: string;
    NEXT_PUBLIC_ENABLE_FIREBASE: string;
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
    NEXT_PUBLIC_FIREBASE_API_KEY: string;
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    NEXT_PUBLIC_FIREBASE_APP_ID: string;
  };
  firebase: {
    projectId: string;
    appId: string;
    authDomain: string;
    storageBucket: string;
    messagingSenderId: string;
    apiKey: string;
    status: string;
    error?: string;
  };
  auth: {
    currentUser: any;
    isAuthenticated: boolean;
    uid?: string;
    email?: string;
    error?: string;
  };
  firestore: {
    testRead: {
      success: boolean;
      error?: string;
      documentCount?: number;
      sampleDocuments?: any[];
    };
  };
}

export default function FirebaseDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runDebugTests = async () => {
      try {
        setLoading(true);
        setError(null);

        const info: DebugInfo = {
          timestamp: new Date().toISOString(),
          environment: {
            NODE_ENV: process.env.NODE_ENV || 'unknown',
            NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'NOT SET',
            NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'NOT SET',
          },
          firebase: {
            projectId: '',
            appId: '',
            authDomain: '',
            storageBucket: '',
            messagingSenderId: '',
            apiKey: '',
            status: 'UNKNOWN'
          },
          auth: {
            currentUser: null,
            isAuthenticated: false
          },
          firestore: {
            testRead: {
              success: false
            }
          }
        };

        // Test Firebase app initialization
        try {
          if (isFirebaseAvailable()) {
            const app = getFirebaseApp();
            info.firebase = {
              projectId: app.options.projectId || 'UNKNOWN',
              appId: app.options.appId || 'UNKNOWN',
              authDomain: app.options.authDomain || 'UNKNOWN',
              storageBucket: app.options.storageBucket || 'UNKNOWN',
              messagingSenderId: app.options.messagingSenderId || 'UNKNOWN',
              apiKey: app.options.apiKey?.substring(0, 10) + '...' || 'UNKNOWN',
              status: 'SUCCESS'
            };
          } else {
            info.firebase = {
              projectId: 'NOT AVAILABLE',
              appId: 'NOT AVAILABLE',
              authDomain: 'NOT AVAILABLE',
              storageBucket: 'NOT AVAILABLE',
              messagingSenderId: 'NOT AVAILABLE',
              apiKey: 'NOT AVAILABLE',
              status: 'FAILED',
              error: 'Firebase not available - check configuration'
            };
          }
        } catch (firebaseError) {
          info.firebase = {
            projectId: 'ERROR',
            appId: 'ERROR',
            authDomain: 'ERROR',
            storageBucket: 'ERROR',
            messagingSenderId: 'ERROR',
            apiKey: 'ERROR',
            status: 'FAILED',
            error: firebaseError instanceof Error ? firebaseError.message : 'Unknown error'
          };
        }

        // Test Auth
        try {
          if (isFirebaseAvailable()) {
            const auth = getAuthInstance();
            const currentUser = auth.currentUser;
            info.auth = {
              currentUser: currentUser ? {
                uid: currentUser.uid,
                email: currentUser.email,
                isAnonymous: currentUser.isAnonymous
              } : null,
              isAuthenticated: !!currentUser,
              uid: currentUser?.uid,
              email: currentUser?.email || undefined
            };
          }
        } catch (authError) {
          info.auth = {
            currentUser: null,
            isAuthenticated: false,
            error: authError instanceof Error ? authError.message : 'Unknown error'
          };
        }

        // Test Firestore read
        try {
          const vacationService = getVacationRequestsService();
          const requests = await vacationService.getAllVacationRequests();
          info.firestore.testRead = {
            success: true,
            documentCount: requests.length,
            sampleDocuments: requests.slice(0, 2).map(r => ({
              id: r.id,
              userName: r.userName,
              status: r.status,
              startDate: r.startDate
            }))
          };
        } catch (firestoreError) {
          info.firestore.testRead = {
            success: false,
            error: firestoreError instanceof Error ? firestoreError.message : 'Unknown error'
          };
        }

        setDebugInfo(info);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    runDebugTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Running Firebase debug tests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Firebase Debug Information</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {debugInfo && (
            <div className="space-y-6">
              {/* Environment Variables */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Environment Variables</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(debugInfo.environment, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Firebase App */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Firebase App</h2>
                <div className={`rounded-lg p-4 ${
                  debugInfo.firebase.status === 'SUCCESS' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {debugInfo.firebase.status === 'SUCCESS' ? (
                    <div>
                      <p className="text-green-800 font-medium">✅ Firebase initialized successfully</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-700"><strong>Project ID:</strong> {debugInfo.firebase.projectId}</p>
                        <p className="text-sm text-gray-700"><strong>App ID:</strong> {debugInfo.firebase.appId}</p>
                        <p className="text-sm text-gray-700"><strong>Auth Domain:</strong> {debugInfo.firebase.authDomain}</p>
                        <p className="text-sm text-gray-700"><strong>Storage Bucket:</strong> {debugInfo.firebase.storageBucket}</p>
                        <p className="text-sm text-gray-700"><strong>Messaging Sender ID:</strong> {debugInfo.firebase.messagingSenderId}</p>
                        <p className="text-sm text-gray-700"><strong>API Key:</strong> {debugInfo.firebase.apiKey}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-800 font-medium">❌ Firebase initialization failed</p>
                      <p className="text-red-700 text-sm mt-1">{debugInfo.firebase.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Auth Status */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Authentication Status</h2>
                <div className={`rounded-lg p-4 ${
                  debugInfo.auth.isAuthenticated ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  {debugInfo.auth.isAuthenticated ? (
                    <div>
                      <p className="text-green-800 font-medium">✅ User authenticated</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-700"><strong>UID:</strong> {debugInfo.auth.uid}</p>
                        <p className="text-sm text-gray-700"><strong>Email:</strong> {debugInfo.auth.email || 'Anonymous'}</p>
                        <p className="text-sm text-gray-700"><strong>Anonymous:</strong> {debugInfo.auth.currentUser?.isAnonymous ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-yellow-800 font-medium">⚠️ No authenticated user</p>
                      <p className="text-yellow-700 text-sm mt-1">This may be expected if using anonymous auth in development</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Firestore Test */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Firestore Test</h2>
                <div className={`rounded-lg p-4 ${
                  debugInfo.firestore.testRead.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {debugInfo.firestore.testRead.success ? (
                    <div>
                      <p className="text-green-800 font-medium">✅ Firestore read successful</p>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700">
                          <strong>Document count:</strong> {debugInfo.firestore.testRead.documentCount}
                        </p>
                        {debugInfo.firestore.testRead.sampleDocuments && debugInfo.firestore.testRead.sampleDocuments.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700 font-medium">Sample documents:</p>
                            <pre className="text-xs text-gray-600 mt-1 bg-white p-2 rounded border">
                              {JSON.stringify(debugInfo.firestore.testRead.sampleDocuments, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-red-800 font-medium">❌ Firestore read failed</p>
                      <p className="text-red-700 text-sm mt-1">{debugInfo.firestore.testRead.error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Recommendations</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  {debugInfo.firebase.status !== 'SUCCESS' ? (
                    <div>
                      <p className="text-blue-800 font-medium">🔧 Fix Firebase Configuration</p>
                      <ul className="text-blue-700 text-sm mt-2 space-y-1">
                        <li>• Check that all NEXT_PUBLIC_FIREBASE_* environment variables are set</li>
                        <li>• Verify the values are not placeholder values like "your_project_id_here"</li>
                        <li>• Restart your development server after updating environment variables</li>
                        <li>• Check the browser console for detailed error messages</li>
                      </ul>
                    </div>
                  ) : !debugInfo.firestore.testRead.success ? (
                    <div>
                      <p className="text-blue-800 font-medium">🔧 Fix Firestore Access</p>
                      <ul className="text-blue-700 text-sm mt-2 space-y-1">
                        <li>• Check Firestore security rules - they may require authentication</li>
                        <li>• Verify the vacationRequests collection exists</li>
                        <li>• Check if Anonymous authentication is enabled in Firebase Console</li>
                        <li>• Run the Admin SDK test: <code className="bg-gray-200 px-1 rounded">npm run test:firestore:admin</code></li>
                      </ul>
                    </div>
                  ) : (
                    <div>
                      <p className="text-green-800 font-medium">🎉 Everything looks good!</p>
                      <p className="text-green-700 text-sm mt-1">
                        Firebase is properly configured and working. You can now use the vacation management features.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Quick Actions</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Refresh Page
                  </button>
                  <a
                    href="/en/admin/vacation-requests"
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Back to Admin
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}