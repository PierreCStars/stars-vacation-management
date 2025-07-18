'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import PersistentCalendar from '@/components/PersistentCalendar';

interface VacationRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  company: string;
  type: string;
  status: string;
  createdAt: string;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  adminComment?: string;
}

export default function AdminVacationRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearingRequests, setClearingRequests] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<string | null>(null);
  const [adminComment, setAdminComment] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin access
    const isAdmin = session.user.email === 'johnny@stars.mc' || session.user.email === 'daniel@stars.mc' || session.user.email === 'pierre@stars.mc' || session.user.email === 'compta@stars.mc';
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    loadVacationRequests();
  }, [session, status, router]);

  const loadVacationRequests = async () => {
    try {
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        setVacationRequests(data);
      }
    } catch (error) {
      console.error('Error loading vacation requests:', error);
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
      console.error('Error clearing requests:', error);
      alert('Error clearing requests');
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
      });

      if (response.ok) {
        const result = await response.json();
        alert(`CSV export sent successfully to compta@stars.mc`);
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

  const handleReviewRequest = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/vacation-requests/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminComment: adminComment.trim() || undefined,
        }),
      });

      if (response.ok) {
        setEditingRequest(null);
        setAdminComment('');
        loadVacationRequests(); // Reload the list
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Error reviewing request');
    }
  };

  const pendingRequests = vacationRequests.filter(req => req.status === 'PENDING');
  const reviewedRequests = vacationRequests.filter(req => req.status !== 'PENDING');

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
          paddingBottom: '3rem'
        }}
      >
        <div 
          className="w-full max-w-4xl"
          style={{ 
            width: '100%', 
            maxWidth: '896px', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem' 
          }}
        >
          <div 
            className="text-center mb-8"
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <Link href="/dashboard">
              <Image 
                src="/stars-logo.png" 
                alt="Stars Logo" 
                width={180}
                height={180}
                style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
                className="mb-6 drop-shadow-lg"
                priority 
              />
            </Link>
            <h1 
              className="text-5xl font-bold tracking-tight mb-6 text-gray-900"
              style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#111827', 
                letterSpacing: '-0.025em', 
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {t.admin.title}
            </h1>
          </div>
          <div 
            className="card text-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ width: 64, height: 64, border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              {t.common.loading}
            </h2>
            <p style={{ color: '#6b7280' }}>Please wait while we load the requests.</p>
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

  if (!session?.user) {
    return null;
  }

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-start py-12"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '3rem',
        paddingBottom: '3rem'
      }}
    >
      <div 
        className="w-full max-w-7xl"
        style={{ 
          width: '100%', 
          maxWidth: '1280px', 
          paddingLeft: '1.5rem', 
          paddingRight: '1.5rem' 
        }}
      >
        {/* Header with Language Selector */}
        <div 
          className="flex justify-between items-center mb-8"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}
        >
          <Link 
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-semibold"
            style={{ 
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            ← {t.common.back}
          </Link>
          <LanguageSelector />
        </div>

        <div 
          className="text-center mb-8"
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <Link href="/dashboard">
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={120}
              height={120}
              style={{ maxWidth: 120, maxHeight: 120, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
              className="mb-4 drop-shadow-lg"
              priority 
            />
          </Link>
          <h1 
            className="text-4xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '2.25rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {t.admin.title}
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ 
              fontSize: '1.125rem', 
              color: '#4b5563',
              lineHeight: 1.6
            }}
          >
            {t.admin.subtitle}
          </p>
        </div>

        {/* Pending Requests */}
        <div 
          className="card mb-8"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
            padding: '2rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-6 text-gray-900"
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '1.5rem' 
            }}
          >
            {t.admin.pendingRequests} ({pendingRequests.length})
          </h2>
          
          {pendingRequests.length === 0 ? (
            <p 
              className="text-gray-500 text-center py-8"
              style={{ 
                color: '#6b7280', 
                textAlign: 'center', 
                padding: '2rem 0' 
              }}
            >
              {t.admin.noPendingRequests}
            </p>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem', 
                    padding: '1rem' 
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 
                        className="font-semibold text-gray-900"
                        style={{ 
                          fontWeight: '600', 
                          color: '#111827' 
                        }}
                      >
                        {request.userName}
                      </h3>
                      <p 
                        className="text-gray-600"
                        style={{ color: '#4b5563' }}
                      >
                        {request.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"
                        style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          backgroundColor: '#fef3c7',
                          color: '#92400e'
                        }}
                      >
                        {t.status.PENDING}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.startDate}
                      </label>
                      <p className="text-gray-900">{new Date(request.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.endDate}
                      </label>
                      <p className="text-gray-900">{new Date(request.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.company}
                      </label>
                      <p className="text-gray-900">{t.companies[request.company as keyof typeof t.companies] || request.company}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.type}
                      </label>
                      <p className="text-gray-900">{t.vacationTypes[request.type as keyof typeof t.vacationTypes] || request.type}</p>
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="mb-4">
                      <label 
                        className="block text-sm font-medium text-gray-500 mb-1"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}
                      >
                        {t.vacationRequest.reason}
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md" style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem' }}>
                        {request.reason}
                      </p>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {/* Action Buttons - Always Visible */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReviewRequest(request.id, 'APPROVED')}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 font-semibold"
                        style={{ 
                          padding: '0.5rem 1rem',
                          backgroundColor: '#16a34a',
                          color: 'white',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          fontWeight: '600'
                        }}
                      >
                        ✓ {t.admin.approve}
                      </button>
                      <button
                        onClick={() => handleReviewRequest(request.id, 'REJECTED')}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200 font-semibold"
                        style={{ 
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc2626',
                          color: 'white',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease',
                          fontWeight: '600'
                        }}
                      >
                        ✗ {t.admin.reject}
                      </button>
                      <button
                        onClick={() => setEditingRequest(editingRequest === request.id ? null : request.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                        style={{ 
                          padding: '0.5rem 1rem',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          borderRadius: '0.375rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        {editingRequest === request.id ? t.common.cancel : t.admin.addComment}
                      </button>
                    </div>
                    {/* Optional Comment Field */}
                    {editingRequest === request.id && (
                      <div className="space-y-2">
                        <label 
                          className="block text-sm font-medium text-gray-700"
                          style={{ 
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: '#374151'
                          }}
                        >
                          {t.admin.addComment} ({t.common.optional})
                        </label>
                        <textarea
                          value={adminComment}
                          onChange={(e) => setAdminComment(e.target.value)}
                          placeholder={t.admin.commentPlaceholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          style={{ 
                            width: '100%',
                            padding: '0.5rem 0.75rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                          rows={3}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Admin Actions */}
        <div 
          className="card mb-8"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
            padding: '1.5rem',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div 
            className="flex flex-wrap gap-4 justify-center"
            style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              justifyContent: 'center'
            }}
          >
            <button
              onClick={handleExportCSV}
              disabled={exportingCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#16a34a',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: exportingCSV ? 'not-allowed' : 'pointer',
                opacity: exportingCSV ? 0.5 : 1,
                transition: 'background-color 0.2s ease'
              }}
            >
              {exportingCSV ? t.admin.exporting : t.admin.exportCSV}
            </button>
            
            <button
              onClick={() => setShowClearModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              style={{ 
                padding: '0.5rem 1rem',
                backgroundColor: '#dc2626',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              {t.admin.clearReviewed}
            </button>
          </div>
        </div>

        {/* Reviewed Requests */}
        <div 
          className="card"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-6 text-gray-900"
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '1.5rem' 
            }}
          >
            {t.admin.reviewedRequests} ({reviewedRequests.length})
          </h2>
          
          {reviewedRequests.length === 0 ? (
            <p 
              className="text-gray-500 text-center py-8"
              style={{ 
                color: '#6b7280', 
                textAlign: 'center', 
                padding: '2rem 0' 
              }}
            >
              {t.admin.noReviewedRequests}
            </p>
          ) : (
            <div className="space-y-4">
              {reviewedRequests.map((request) => (
                <div 
                  key={request.id}
                  className="border border-gray-200 rounded-lg p-4"
                  style={{ 
                    border: '1px solid #e5e7eb', 
                    borderRadius: '0.5rem', 
                    padding: '1rem' 
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 
                        className="font-semibold text-gray-900"
                        style={{ 
                          fontWeight: '600', 
                          color: '#111827' 
                        }}
                      >
                        {request.userName}
                      </h3>
                      <p 
                        className="text-gray-600"
                        style={{ color: '#4b5563' }}
                      >
                        {request.userEmail}
                      </p>
                    </div>
                    <div className="text-right">
                      <span 
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'APPROVED' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                        style={{ 
                          display: 'inline-block',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          borderRadius: '9999px',
                          backgroundColor: request.status === 'APPROVED' ? '#dcfce7' : '#fee2e2',
                          color: request.status === 'APPROVED' ? '#166534' : '#991b1b'
                        }}
                      >
                        {t.status[request.status as keyof typeof t.status] || request.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.startDate}
                      </label>
                      <p className="text-gray-900">{new Date(request.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.endDate}
                      </label>
                      <p className="text-gray-900">{new Date(request.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.company}
                      </label>
                      <p className="text-gray-900">{t.companies[request.company as keyof typeof t.companies] || request.company}</p>
                    </div>
                    <div>
                      <label 
                        className="block text-sm font-medium text-gray-500"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280'
                        }}
                      >
                        {t.admin.type}
                      </label>
                      <p className="text-gray-900">{t.vacationTypes[request.type as keyof typeof t.vacationTypes] || request.type}</p>
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="mb-4">
                      <label 
                        className="block text-sm font-medium text-gray-500 mb-1"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}
                      >
                        {t.vacationRequest.reason}
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-md" style={{ backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '0.375rem' }}>
                        {request.reason}
                      </p>
                    </div>
                  )}
                  
                  {request.adminComment && (
                    <div className="mb-4">
                      <label 
                        className="block text-sm font-medium text-gray-500 mb-1"
                        style={{ 
                          display: 'block',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}
                      >
                        Admin Comment
                      </label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-md" style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '0.375rem' }}>
                        {request.adminComment}
                      </p>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    <p>
                      {t.admin.reviewedBy}: {request.reviewedBy} ({request.reviewerEmail})
                    </p>
                    <p>
                      {t.admin.reviewDate}: {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear Modal */}
      {showClearModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            style={{ 
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '28rem',
              width: '100%',
              margin: '0 1rem'
            }}
          >
            <h3 
              className="text-lg font-semibold mb-4"
              style={{ 
                fontSize: '1.125rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}
            >
              {t.admin.clearReviewedConfirm}
            </h3>
            <p 
              className="text-gray-600 mb-6"
              style={{ 
                color: '#4b5563',
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              {t.admin.clearReviewedWarning}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                style={{ 
                  padding: '0.5rem 1rem',
                  color: '#374151',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
              >
                {t.admin.cancel}
              </button>
              <button
                onClick={handleClearReviewedRequests}
                disabled={clearingRequests}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                style={{ 
                  padding: '0.5rem 1rem',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: clearingRequests ? 'not-allowed' : 'pointer',
                  opacity: clearingRequests ? 0.5 : 1,
                  transition: 'background-color 0.2s ease'
                }}
              >
                {clearingRequests ? t.admin.clearing : t.admin.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      <PersistentCalendar />
    </main>
  );
} 
