'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the vacation requests admin page
    router.push('/admin/vacation-requests');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Redirecting to Admin Panel...</h1>
        <p className="text-gray-600">Please wait while we redirect you to the vacation requests management page.</p>
      </div>
    </div>
  );
}
 