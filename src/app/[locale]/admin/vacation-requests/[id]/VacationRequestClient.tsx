'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import CalendarConflictsPanel from '@/components/CalendarConflictsPanel';

import { VacationRequest } from '@/types/vacation';

interface VacationRequestClientProps {
  id: string;
}

export default function VacationRequestClient({ id }: VacationRequestClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [request, setRequest] = useState<VacationRequest | null>(null);
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin?callbackUrl=/admin/vacation-requests');
      return;
    }

    // Check if user has admin access
    if (!session.user.email.endsWith('@stars.mc')) {
      setError('Access denied. Only @stars.mc users can access this page.');
      setLoading(false);
      return;
    }

    loadVacationRequest();
  }, [session, status, router, id]);

  const loadVacationRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/vacation-requests');
      if (!response.ok) {
        throw new Error('Failed to load vacation requests');
      }

      const data = await response.json();
      const foundRequest = data.find((req: VacationRequest) => req.id === id);
      
      if (!foundRequest) {
        setError('Request not found');
        return;
      }

      setRequest(foundRequest);
      setAllVacationRequests(data); // Store all requests for conflict analysis
    } catch (err) {
      console.error('Error loading vacation request:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vacation request');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (status: 'approved' | 'denied') => {
    if (!request) return;

    try {
      setSubmitting(true);

      const response = await fetch(`/api/vacation-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          comment,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vacation request');
      }

      // Redirect back to the admin page
      router.push('/admin/vacation-requests');
    } catch (err) {
      console.error('Error updating vacation request:', err);
      setError(err instanceof Error ? err.message : 'Failed to update vacation request');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
            Loading Vacation Request...
          </h2>
          <p style={{ color: '#6b7280' }}>Please wait while we fetch the request details.</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
            <span style={{ color: '#dc2626', fontSize: 32 }}>⚠️</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 16 }}>
            {error || 'Request not found'}
          </h2>
          <Link 
            href="/admin/vacation-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              border: '1px solid transparent',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: 8,
              color: '#fff',
              background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
          >
            Back to Requests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: '#000000' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* Centered Stars Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link href="/dashboard">
            <Image
              src="/stars-logo.png"
              alt="Stars Logo"
              width={180}
              height={180}
              style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
              priority

            />
          </Link>
        </div>
      
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#000000' }}>Vacation Request Details</h1>
        
        <div style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, border: '1px solid #eee', marginBottom: 24 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 12 }}>Employee Information</h2>
            <p style={{ color: '#000000', marginBottom: 8 }}>Name: {request.userName}</p>
            <p style={{ color: '#000000' }}>Email: {request.userEmail || request.userId}</p>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 12 }}>Request Details</h2>
            <p style={{ color: '#000000', marginBottom: 8 }}>Start Date: {new Date(request.startDate).toLocaleDateString()}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>End Date: {new Date(request.endDate).toLocaleDateString()}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Type: {request.type === 'PAID_VACATION' ? 'Paid Vacation' :
                                             request.type === 'UNPAID_VACATION' ? 'Unpaid Vacation' :
                                             request.type === 'SICK_LEAVE' ? 'Sick Leave' :
                                             request.type === 'OTHER' ? 'Other' : request.type}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Reason: {request.reason || 'No reason provided'}</p>
            <p style={{ color: '#000000', marginBottom: 8 }}>Company: {request.company}</p>
            <p style={{ color: '#000000' }}>Status: {request.status}</p>
          </div>

          {request.status === 'pending' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#000000', marginBottom: 16 }}>Make a Decision</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="comment" style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#000000', marginBottom: 8 }}>
                    Comment (optional)
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    style={{ 
                      width: '100%', 
                      padding: '12px', 
                      border: '1px solid #d1d5db', 
                      borderRadius: 8, 
                      fontSize: '14px',
                      color: '#000000',
                      backgroundColor: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                  <button
                    onClick={() => handleDecision('approved')}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(90deg, #22c55e 0%, #059669 100%)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    {submitting ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleDecision('denied')}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      background: 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: 8,
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: submitting ? 0.6 : 1
                    }}
                  >
                    {submitting ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Google Calendar Conflicts Panel */}
        <div style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, border: '1px solid #eee', marginBottom: 24 }}>
          <CalendarConflictsPanel
            requestId={request.id}
            startDate={request.startDate}
            endDate={request.endDate}
            requesterUserId={request.userId || request.userEmail || ''}
          />
        </div>

        {/* Unified Vacation Calendar with Conflict Detection */}
        <div style={{ background: '#fff', boxShadow: '0 4px 32px rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, border: '1px solid #eee', marginBottom: 24 }}>
          <h3 style={{ fontSize: '20px', fontWeight: 600, color: '#1f2937', marginBottom: 16 }}>
            🗓️ Vacation Calendar & Conflict Detection
          </h3>
          <p style={{ color: '#6b7280', marginBottom: 20, fontSize: '14px' }}>
            This calendar shows all vacation requests with company colors and conflict warnings. Look for dates with multiple people requesting time off.
          </p>
          <UnifiedVacationCalendar 
            vacationRequests={allVacationRequests.filter(r => r.status?.toLowerCase() === 'approved')} 
            currentRequestId={request.id}
            showLegend={true}
            compact={false}
          />
        </div>

        {/* Back to Requests Button */}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link 
            href="/admin/vacation-requests"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '12px 24px',
              border: '1px solid transparent',
              fontSize: '14px',
              fontWeight: 500,
              borderRadius: 8,
              color: '#fff',
              background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 100%)',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
          >
            Back to Requests
          </Link>
        </div>
      </div>
    </div>
  );
} 