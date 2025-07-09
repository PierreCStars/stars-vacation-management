import PersistentCalendar from '@/components/PersistentCalendar';

export default function TestDeploymentPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      background: '#fff',
      padding: 20
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24, color: '#2563eb' }}>
        🎉 Deployment Test Successful!
      </h1>
      <p style={{ fontSize: 18, color: '#666', textAlign: 'center', maxWidth: 600 }}>
        If you can see this page, your Next.js app is deployed and working correctly on Vercel.
      </p>
      <div style={{ 
        background: '#f3f4f6', 
        padding: 20, 
        borderRadius: 12, 
        marginTop: 32,
        maxWidth: 600,
        width: '100%'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: 16 }}>Environment Check:</h3>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          <li>✅ Next.js App Router working</li>
          <li>✅ Static page generation working</li>
          <li>✅ Basic routing working</li>
        </ul>
      </div>
      <a 
        href="/" 
        style={{ 
          marginTop: 32, 
          padding: '12px 24px', 
          background: '#2563eb', 
          color: '#fff', 
          textDecoration: 'none', 
          borderRadius: 8, 
          fontWeight: 600 
        }}
      >
        Go to Home Page
      </a>
    </div>
  );
} 