"use client";
import { useSession } from "next-auth/react";
import Link from "next-intl/link";

export default function TestSessionPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div style={{ padding: '20px' }}>Loading session...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Session Test Page</h1>
      <h2>Current Session:</h2>
      <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
        {JSON.stringify(session, null, 2)}
      </pre>
      
      <h2>Test Links:</h2>
      <div style={{ marginTop: '20px' }}>
        <Link href="/api/auth/signin" style={{ 
          display: 'inline-block', 
          padding: '10px 20px', 
          background: '#0070f3', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px',
          marginRight: '10px'
        }}>
          Sign In with Google
        </Link>
        
        <Link href="/api/auth/signout" style={{ 
          display: 'inline-block', 
          padding: '10px 20px', 
          background: '#ff4444', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px'
        }}>
          Sign Out
        </Link>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <Link href="/" style={{ color: '#0070f3' }}>← Back to Home</Link>
      </div>
    </div>
  );
} 