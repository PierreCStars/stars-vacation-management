'use client';

export default function Error({ 
  error, 
  reset 
}: { 
  error: Error & { digest?: string }; 
  reset: () => void;
}) {
  console.error('VACATION_REQUESTS_ERROR_BOUNDARY', error);
  
  return (
    <div style={{ padding: 24 }}>
      <h2>Something went wrong in Vacation Requests</h2>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px', background: '#f5f5f5', padding: '12px', borderRadius: '4px' }}>
        {JSON.stringify({ 
          message: error.message, 
          digest: (error as any).digest,
          stack: error.stack?.split('\n').slice(0, 10).join('\n')
        }, null, 2)}
      </pre>
      <button 
        onClick={() => reset()}
        style={{ 
          background: '#0070f3', 
          color: 'white', 
          border: 'none', 
          padding: '8px 16px', 
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '12px'
        }}
      >
        Retry
      </button>
    </div>
  );
}
