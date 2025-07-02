import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SortableVacationRequestsTable from '@/components/SortableVacationRequestsTable';
import { getAllVacationRequests } from '@/lib/vacation-requests';

export default async function AdminVacationRequestsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, marginBottom: 24 }}>Not signed in</h2>
        <Link href="/auth/signin" style={{ color: '#2563eb', fontWeight: 600, fontSize: 18, textDecoration: 'underline' }}>Go to Sign In</Link>
      </div>
    );
  }

  const requests = await getAllVacationRequests();
  const firstName = session.user.name?.split(' ')[0] || 'Admin';
  const pendingCount = requests.filter(req => req.status === 'PENDING').length;
  const reviewedCount = requests.filter(req => req.status === 'APPROVED' || req.status === 'REJECTED').length;
  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const reviewedRequests = requests.filter(req => req.status === 'APPROVED' || req.status === 'REJECTED');

  return (
    <div style={{ background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: 20, padding: 20, minHeight: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
        {/* Header Card */}
        <div style={{ marginTop: 32, marginBottom: 40, padding: 32, background: '#fff', borderRadius: 24, boxShadow: '0 4px 32px rgba(0,0,0,0.08)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 24, maxWidth: 480, width: '100%' }}>
          <Link href="/">
            <img src="/stars-logo.png" alt="Stars Logo" style={{ height: 64, width: 64, objectFit: 'contain', marginBottom: 8, cursor: 'pointer', transition: 'opacity 0.2s', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
          </Link>
          <h2 style={{ fontSize: 32, fontWeight: 700, textTransform: 'uppercase', margin: 0, marginTop: 8, marginBottom: 0, letterSpacing: 2 }}>ADMIN DASHBOARD</h2>
          <span style={{ fontSize: 18, color: '#666', fontWeight: 500 }}>Welcome, {firstName}!</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ background: '#f3f4f6', borderRadius: 16, padding: 24, minWidth: 180, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>{pendingCount}</div>
          <div style={{ fontSize: 14, color: '#333', textTransform: 'uppercase', fontWeight: 600 }}>Pending</div>
        </div>
        <div style={{ background: '#f3f4f6', borderRadius: 16, padding: 24, minWidth: 180, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#059669', marginBottom: 8 }}>{reviewedCount}</div>
          <div style={{ fontSize: 14, color: '#333', textTransform: 'uppercase', fontWeight: 600 }}>Reviewed</div>
        </div>
      </div>

      {/* Pending Requests Section */}
      <section style={{ width: '100%', maxWidth: 900, margin: '0 auto 48px auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>PENDING REQUESTS ({pendingCount})</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 16 }}>These requests are waiting for your approval or rejection</p>
        <SortableVacationRequestsTable requests={pendingRequests} type="pending" />
      </section>

      {/* Reviewed Requests Section */}
      <section style={{ width: '100%', maxWidth: 900, margin: '0 auto 48px auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>REVIEWED REQUESTS ({reviewedCount})</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 16 }}>These requests have been processed and can be exported</p>
        <SortableVacationRequestsTable requests={reviewedRequests} type="reviewed" />
      </section>

      {/* Sign Out button at the bottom */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 64, marginBottom: 32 }}>
        <form action="/api/auth/signout" method="post">
          <button type="submit" style={{ padding: '10px 24px', background: '#f3f4f6', color: '#374151', borderRadius: 12, fontWeight: 600, fontSize: 16, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}>Sign Out</button>
        </form>
      </div>
    </div>
  );
}  
