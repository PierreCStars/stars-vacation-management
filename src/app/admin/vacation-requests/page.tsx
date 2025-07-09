'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SortableVacationRequestsTable from '@/components/SortableVacationRequestsTable';
import GoogleCalendar from '@/components/GoogleCalendar';
import Image from 'next/image';
import Link from 'next/link';

interface VacationRequest {
  id: string;
  userName: string;
  userId: string;
  company: string;
  type?: string;
  startDate: string;
  endDate: string;
  status: string;
  comment?: string;
  reason?: string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
}

export default function AdminVacationRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewedRequestsExpanded, setReviewedRequestsExpanded] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingRequests, setClearingRequests] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin access
    if (!session.user.email.endsWith('@stars.mc')) {
      setError('Access denied. Only @stars.mc users can access this page.');
      setLoading(false);
      return;
    }

    loadVacationRequests();
  }, [session, status, router]);

  const loadVacationRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/vacation-requests');
      if (!response.ok) {
        throw new Error('Failed to load vacation requests');
      }

      const data = await response.json();
      setVacationRequests(data);
    } catch (err) {
      console.error('Error loading vacation requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vacation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleClearReviewedRequests = async () => {
    try {
      setClearingRequests(true);
      const response = await fetch('/api/clear-reviewed-requests', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully cleared ${result.deletedCount} reviewed requests`);
        loadVacationRequests(); // Reload the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error clearing reviewed requests:', error);
      alert('Error clearing reviewed requests');
    } finally {
      setClearingRequests(false);
      setShowClearModal(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);
      const response = await fetch('/api/monthly-csv-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`CSV export completed! ${result.count} records sent to compta@stars.mc`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center py-12"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '3rem',
        }}
      >
        <div className="w-full max-w-7xl" style={{ width: '100%', maxWidth: '1400px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/dashboard">
              <Image src="/stars-logo.png" alt="Stars Logo" width={180} height={180} style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }} className="mb-6 drop-shadow-lg" priority />
            </Link>
            <h1 className="text-5xl font-bold tracking-tight mb-6 text-gray-900" style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.025em', marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Vacation Requests Admin
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', maxWidth: '42rem', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Manage and review employee vacation requests
            </p>
          </div>
          <div className="card text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2rem', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div style={{ width: 64, height: 64, border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              Loading Vacation Requests...
            </h2>
            <p style={{ color: '#6b7280' }}>Please wait while we fetch the latest data.</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (error) {
    return (
      <main
        className="min-h-screen flex flex-col items-center justify-center py-12"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '3rem',
        }}
      >
        <div className="w-full max-w-4xl" style={{ width: '100%', maxWidth: '896px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
          <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/dashboard">
              <Image src="/stars-logo.png" alt="Stars Logo" style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }} className="mb-6 drop-shadow-lg" priority />
            </Link>
            <h1 className="text-5xl font-bold tracking-tight mb-6 text-gray-900" style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.025em', marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Vacation Requests Admin
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', maxWidth: '42rem', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Manage and review employee vacation requests
            </p>
          </div>
          <div className="card text-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2rem', textAlign: 'center', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <span style={{ color: '#dc2626', fontSize: 32 }}>⚠️</span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
              Access Denied
            </h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>{error}</p>
            <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, padding: '0.5rem 1rem', borderRadius: '0.5rem', transition: 'background-color 0.2s', display: 'inline-block' }} className="hover:bg-gray-100">
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const pendingRequests = vacationRequests.filter(req => req.status === 'PENDING');
  const reviewedRequests = vacationRequests.filter(req => req.status !== 'PENDING');

  // Main content
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center py-12"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '3rem',
        paddingBottom: '3rem',
      }}
    >
      <div className="w-full max-w-7xl" style={{ width: '100%', maxWidth: '1400px', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
        <div className="text-center mb-8" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/dashboard">
            <Image src="/stars-logo.png" alt="Stars Logo" width={180} height={180} style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }} className="mb-6 drop-shadow-lg" priority />
          </Link>
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-gray-900" style={{ fontSize: '3rem', fontWeight: '700', color: '#111827', letterSpacing: '-0.025em', marginBottom: '1.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            Vacation Requests Admin
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.25rem', color: '#4b5563', marginBottom: '2rem', maxWidth: '42rem', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
            Manage and review employee vacation requests
          </p>
          <div className="mb-8 flex justify-center gap-4">
            <Link href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, padding: '0.5rem 1.25rem', borderRadius: '0.5rem', transition: 'background-color 0.2s', display: 'inline-block', border: '1px solid #2563eb', background: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }} className="hover:bg-blue-50">
              ← Back to Dashboard
            </Link>
            <a
              href="/Stars-Vacation-Management-Guide.pdf"
              download="Stars-Vacation-Management-Guide.pdf"
              style={{ 
                color: '#9333ea', 
                textDecoration: 'none', 
                fontSize: '0.95rem', 
                fontWeight: 600, 
                padding: '0.5rem 1.25rem', 
                borderRadius: '0.5rem', 
                transition: 'background-color 0.2s', 
                display: 'inline-block', 
                border: '1px solid #9333ea', 
                background: 'white', 
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)' 
              }}
              className="hover:bg-purple-50 transition-colors duration-200"
            >
              📖 User Guide
            </a>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Vacation Requests Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {exportingCSV ? 'Exporting...' : '📄 Export CSV'}
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Clear Reviewed
            </button>
          </div>
        </div>
        {/* Pending Requests Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center" style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', textAlign: 'center', margin: '0 auto' }}>Pending Requests</h2>
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            {pendingRequests.length > 0 ? (
              <SortableVacationRequestsTable requests={pendingRequests} type="pending" />
            ) : (
              <div className="text-center text-gray-500" style={{ padding: '2rem' }}>
                <span style={{ fontSize: 32, color: '#9ca3af' }}>📄</span>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginTop: 8 }}>No pending requests</div>
                <div style={{ color: '#6b7280' }}>There are currently no pending vacation requests.</div>
              </div>
            )}
          </div>
        </div>
        {/* Reviewed Requests Section */}
        <div className="mb-8">
          <div 
            className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 transition-colors duration-200"
            onClick={() => {
              console.log('Toggle clicked, current state:', reviewedRequestsExpanded);
              setReviewedRequestsExpanded(!reviewedRequestsExpanded);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer', 
              marginBottom: '1rem',
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'background-color 0.2s',
              border: '1px solid #e5e7eb'
            }}
          >
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', margin: 0 }}>
              Reviewed Requests ({reviewedRequests.length}) - {reviewedRequestsExpanded ? 'Expanded' : 'Collapsed'}
            </h2>
            <div 
              style={{ 
                transform: reviewedRequestsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
                fontSize: '1.5rem',
                color: '#6b7280'
              }}
            >
              ▼
            </div>
          </div>
          {reviewedRequestsExpanded && (
            <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              {reviewedRequests.length > 0 ? (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleClearReviewedRequests}
                      disabled={clearingRequests}
                      style={{
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem 1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        cursor: clearingRequests ? 'not-allowed' : 'pointer',
                        opacity: clearingRequests ? 0.6 : 1,
                        transition: 'background-color 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      className="hover:bg-red-700 transition-colors duration-200"
                    >
                      {clearingRequests ? (
                        <>
                          <div style={{ width: '16px', height: '16px', border: '2px solid transparent', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Clearing...
                        </>
                      ) : (
                        <>
                          🗑️ Clear Table
                        </>
                      )}
                    </button>
                  </div>
                  <SortableVacationRequestsTable requests={reviewedRequests} type="reviewed" />
                </>
              ) : (
                <div className="text-center text-gray-500" style={{ padding: '2rem' }}>
                  <span style={{ fontSize: 32, color: '#9ca3af' }}>📄</span>
                  <div style={{ fontSize: 18, fontWeight: 600, color: '#111827', marginTop: 8 }}>No reviewed requests</div>
                  <div style={{ color: '#6b7280' }}>There are currently no reviewed vacation requests.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clear Confirmation Modal */}
        {showClearModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '1rem',
              padding: '2rem',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                Attention, Data Will Be Lost!
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '2rem', lineHeight: '1.6' }}>
                Are you sure you want to clear all reviewed vacation requests? This action cannot be undone and all reviewed data will be permanently deleted.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowClearModal(false)}
                  disabled={clearingRequests}
                  style={{
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: clearingRequests ? 'not-allowed' : 'pointer',
                    opacity: clearingRequests ? 0.6 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearReviewedRequests}
                  disabled={clearingRequests}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: clearingRequests ? 'not-allowed' : 'pointer',
                    opacity: clearingRequests ? 0.6 : 1,
                    transition: 'background-color 0.2s'
                  }}
                  className="hover:bg-red-700 transition-colors duration-200"
                >
                  {clearingRequests ? 'Clearing...' : 'Yes, Clear All'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center" style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', marginBottom: '1rem', textAlign: 'center' }}>Team Calendar</h2>
          <div className="card" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', padding: '2.5rem', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <GoogleCalendar 
              calendarId="pierre@stars.mc"
              height="500px"
              title="Stars Vacation Calendar"
              userEmail={session?.user?.email}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 
