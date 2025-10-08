"use client";
import { useEffect } from 'react';

export default function AdminPendingRequestsV2() {
  useEffect(() => { 
    console.log("[HYDRATION] AdminPendingV2 mounted"); 
  }, []);
  
  return (
    <div data-test="pending-list-v2" className="p-4">
      <div className="fixed bottom-2 right-2 z-[9999] bg-fuchsia-600 text-white text-xs px-2 py-1 rounded">
        Admin Pending V2
      </div>
      <h1 className="text-xl font-bold">Admin Pending V2 (placeholder)</h1>
      <p className="text-gray-600 mt-2">
        This is the new layout component. If you can see this, the wiring is working!
      </p>
    </div>
  );
}
