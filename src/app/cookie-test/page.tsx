"use client";
import { useEffect, useState } from "react";
import PersistentCalendar from '@/components/PersistentCalendar';

export default function CookieTestPage() {
  const [cookies, setCookies] = useState<string>("");
  const [sessionCookie, setSessionCookie] = useState<string>("");

  useEffect(() => {
    // Get all cookies
    const allCookies = document.cookie;
    setCookies(allCookies);

    // Look for NextAuth session cookie
    const sessionCookieMatch = allCookies.match(/next-auth\.session-token=([^;]+)/);
    if (sessionCookieMatch) {
      setSessionCookie(sessionCookieMatch[1]);
    } else {
      setSessionCookie("NOT FOUND");
    }
  }, []);

  const clearAllCookies = () => {
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    window.location.reload();
  };

  return (
    <main>
      <div style={{ padding: '20px', fontFamily: 'monospace', color: '#000000' }}>
        <h1 style={{ color: '#000000' }}>Cookie Test Page</h1>
        
        <h2 style={{ color: '#000000' }}>All Cookies:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', wordBreak: 'break-all', color: '#000000' }}>
          {cookies || 'No cookies found'}
        </pre>
        
        <h2 style={{ color: '#000000' }}>NextAuth Session Cookie:</h2>
        <pre style={{ background: '#f0f0f0', padding: '10px', borderRadius: '5px', wordBreak: 'break-all', color: '#000000' }}>
          {sessionCookie}
        </pre>
        
        <button 
          onClick={clearAllCookies}
          style={{
            background: '#ff4444',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Clear All Cookies
        </button>
        
        <p style={{ marginTop: '20px', color: '#000000' }}>
          After clearing cookies, try signing in again to see if the session cookie is properly set.
        </p>
      </div>
      <PersistentCalendar />
    </main>
  );
} 