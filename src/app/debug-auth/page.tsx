"use client";

import { useSession } from "next-auth/react";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();

  return (
    <main>
      <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000000' }}>
        <h1 style={{ color: '#000000' }}>Authentication Debug</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Session Status:</h3>
          <p style={{ color: '#000000' }}>Status: {status}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Session Data:</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', color: '#000000' }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div>
          <a href="/" style={{ color: '#0070f3' }}>← Back to Home</a>
        </div>
      </div>
    </main>
  );
} 