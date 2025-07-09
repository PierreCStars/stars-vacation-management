"use client";

import PersistentCalendar from '@/components/PersistentCalendar';

export default function DebugEnvPage() {
  return (
    <main>
      <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000000' }}>
        <h1 style={{ color: '#000000' }}>Environment Variables Debug</h1>
        
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Client-side Environment Variables:</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', color: '#000000' }}>
            NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'Not set'}
          </pre>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Server-side Environment Variables (via API):</h3>
          <p style={{ color: '#000000' }}>
            Note: Server-side environment variables are not accessible from client-side code.
            Check the server logs for NEXTAUTH_URL, GOOGLE_ID, etc.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#000000' }}>Current URL:</h3>
          <p style={{ color: '#000000' }}>
            {typeof window !== 'undefined' ? window.location.href : 'Server-side rendering'}
          </p>
        </div>

        <div>
          <a href="/" style={{ color: '#0070f3' }}>← Back to Home</a>
        </div>
      </div>
      <PersistentCalendar />
    </main>
  );
} 