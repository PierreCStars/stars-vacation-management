"use client";
import { useEffect, useState } from 'react';

export default function AdminPendingRequestsV2() {
  const [mounted, setMounted] = useState(false);
  const [randomId, setRandomId] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => { 
    console.log("[HYDRATION] AdminPendingV2 mounted - FORCE DEPLOYMENT TEST");
    setMounted(true);
    setRandomId(Math.random().toString(36).substr(2, 9));
    setCurrentTime(new Date().toISOString());
  }, []);
  
  return (
    <div data-test="pending-list-v2" className="p-4">
      <div className="fixed bottom-2 right-2 z-[9999] bg-fuchsia-600 text-white text-xs px-2 py-1 rounded">
        Admin Pending V2 - FORCE DEPLOY
      </div>
      <h1 className="text-xl font-bold">Admin Pending V2 (placeholder) - FORCE DEPLOYMENT TEST</h1>
      <p className="text-gray-600 mt-2">
        This is the new layout component. If you can see this, the wiring is working!
        <br />
        {mounted && (
          <>
            <strong>Current time: {currentTime}</strong>
            <br />
            <strong>FORCE DEPLOYMENT: {randomId}</strong>
          </>
        )}
      </p>
    </div>
  );
}
