"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import PersistentCalendar from '@/components/PersistentCalendar';

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [appUrl, setAppUrl] = useState<string>("");

  useEffect(() => {
    setAppUrl(window.location.origin);
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/debug-auth" });
    } catch (error) {
      console.error("Sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut({ callbackUrl: "/debug-auth" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Authentication Debug Page</h1>
        
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
          <h3>Session Status: {status}</h3>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Current Session:</h3>
          <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Environment Check:</h3>
          <p>NEXTAUTH_URL: {process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'Not set'}</p>
          <p>App URL: {appUrl || 'Loading...'}</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Actions:</h3>
          <button 
            onClick={handleSignIn}
            disabled={isLoading}
            style={{ 
              padding: '10px 20px', 
              marginRight: '10px',
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In with Google'}
          </button>
          
          <button 
            onClick={handleSignOut}
            disabled={isLoading}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#ff4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Debug Links:</h3>
          <a 
            href="/api/auth/session" 
            target="_blank"
            style={{ color: '#0070f3', marginRight: '10px' }}
          >
            Session API
          </a>
          <a 
            href="/api/auth/providers" 
            target="_blank"
            style={{ color: '#0070f3', marginRight: '10px' }}
          >
            Providers API
          </a>
          <a 
            href="/api/auth/csrf" 
            target="_blank"
            style={{ color: '#0070f3' }}
          >
            CSRF Token
          </a>
        </div>

        <div>
          <a href="/" style={{ color: '#0070f3' }}>← Back to Home</a>
        </div>
      </div>
      <PersistentCalendar />
    </main>
  );
} 