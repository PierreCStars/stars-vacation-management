import { getFirebaseAdmin } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

export default async function FirebaseDebugPage() {
  const { app, db, error } = getFirebaseAdmin();
  
  const envStatus = {
    FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Firebase Admin Status</h2>
          <div className="space-y-2">
            <p><strong>App:</strong> {app ? '✅ Initialized' : '❌ Not initialized'}</p>
            <p><strong>Database:</strong> {db ? '✅ Connected' : '❌ Not connected'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Environment Variables</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(envStatus).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {value ? '✅' : '❌'}
                </span>
                <span className="font-mono text-sm">{key}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Quick Tests</h2>
          <div className="space-y-2">
            <a 
              href="/api/test-firebase" 
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              target="_blank"
            >
              Test Firebase Connection
            </a>
            <a 
              href="/api/test-db" 
              className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 ml-2"
              target="_blank"
            >
              Test Database
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}