"use client";

import { useEffect, useState } from 'react';

export default function DebugBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [debugInfo, setDebugInfo] = useState<{
    commit: string;
    firebaseEnabled: boolean;
    hostname: string;
  } | null>(null);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      process.env.NEXT_PUBLIC_SHOW_DEBUG === 'true';
    
    if (!shouldShow) return;

    setShowBanner(true);
    
    // Fetch debug info from health endpoint
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setDebugInfo({
          commit: data.commit?.slice(0, 7) || 'unknown',
          firebaseEnabled: data.firebaseEnabled || false,
          hostname: window.location.hostname,
        });
      })
      .catch(err => {
        console.warn('Failed to fetch debug info:', err);
        setDebugInfo({
          commit: 'unknown',
          firebaseEnabled: false,
          hostname: window.location.hostname,
        });
      });
  }, []);

  if (!showBanner || !debugInfo) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 border-b border-yellow-400 text-yellow-800 text-xs px-4 py-2 font-mono">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <span className="font-bold">DEBUG MODE</span>
          <span>Commit: {debugInfo.commit}</span>
          <span>Firebase: {debugInfo.firebaseEnabled ? '✅' : '❌'}</span>
          <span>Host: {debugInfo.hostname}</span>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-yellow-600 hover:text-yellow-800 font-bold"
          aria-label="Close debug banner"
        >
          ×
        </button>
      </div>
    </div>
  );
}
