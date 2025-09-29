'use client';
import { errorLogger } from '@/lib/error-logger';

export default function GlobalError({ error, reset }: { error: any; reset: () => void }) {
  // Log error with comprehensive context
  const digest = errorLogger.logError(error, {
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
  });

  console.error('GlobalError', { 
    message: error?.message, 
    digest: digest,
    stack: error?.stack,
    url: typeof window !== 'undefined' ? window.location.href : 'unknown'
  });
  
  return (
    <html>
      <body>
        <div style={{ 
          padding: 24, 
          fontFamily: "system-ui, -apple-system, sans-serif",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f9fafb"
        }}>
          <div style={{
            maxWidth: "400px",
            width: "100%",
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: "48px",
                height: "48px",
                backgroundColor: "#fef2f2",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}>
                <span style={{ fontSize: "24px" }}>⚠️</span>
              </div>
              <h1 style={{ 
                fontSize: "20px", 
                fontWeight: "600", 
                color: "#111827",
                margin: "0 0 8px 0"
              }}>
                We're fixing an issue
              </h1>
              <p style={{ 
                fontSize: "14px", 
                color: "#6b7280",
                margin: "0 0 16px 0"
              }}>
                Our team has been notified and is working on a fix.
              </p>
              <div style={{
                backgroundColor: "#f3f4f6",
                borderRadius: "6px",
                padding: "12px",
                margin: "0 0 16px 0"
              }}>
                <p style={{ 
                  fontSize: "12px", 
                  color: "#6b7280",
                  margin: "0"
                }}>
                  Reference: <span style={{ fontFamily: "monospace" }}>{String((error as any)?.digest || 'n/a')}</span>
                </p>
              </div>
              <button 
                onClick={() => reset()}
                style={{
                  width: "100%",
                  padding: "8px 16px",
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer"
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
