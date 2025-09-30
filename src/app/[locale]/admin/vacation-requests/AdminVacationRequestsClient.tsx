"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import UnifiedVacationCalendar from "@/components/UnifiedVacationCalendar";
import ConflictDetailsDrawer from "@/components/ConflictDetailsDrawer";
import FirebaseDebugPanel from "@/components/FirebaseDebugPanel";
import FirebaseDiagnostics from "@/components/FirebaseDiagnostics";
import { isFirebaseEnabled } from "@/lib/firebase/client";
import { VacationRequestWithConflicts } from './_server/getRequestsWithConflicts';

// Handle browser extension interference - moved to useEffect

interface AdminVacationRequestsClientProps {
  initialRequests: VacationRequestWithConflicts[];
  pending: VacationRequestWithConflicts[];
  reviewed: VacationRequestWithConflicts[];
  conflictCount: number;
}

export default function AdminVacationRequestsClient({ 
  initialRequests, 
  pending, 
  reviewed, 
  conflictCount 
}: AdminVacationRequestsClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tVacations = useTranslations('vacations');

  // Client-side state for interactive features
  const [sortKey, setSortKey] = useState<"date"|"employee"|"company"|"type"|"status">("date");
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc");
  const [showReviewed, setShowReviewed] = useState(true);
  const [selectedConflictRequest, setSelectedConflictRequest] = useState<string | null>(null);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);

  // Handle browser extension interference and unhandled promise rejections
  useEffect(() => {
    // Handle browser extension interference
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received') ||
          message.includes('Cannot read properties of undefined (reading \'_controlUniqueID\')') ||
          message.includes('content_script.js')) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Handle unhandled promise rejections from browser extensions
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.toString() || '';
      if (reason.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received') ||
          reason.includes('Cannot read properties of undefined (reading \'_controlUniqueID\')') ||
          reason.includes('content_script.js')) {
        event.preventDefault();
        return;
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Set Firebase enabled state after mount
  useEffect(() => {
    setFirebaseEnabled(process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true');
  }, []);

  function sortReviewed(list: VacationRequestWithConflicts[]) {
    const copy = [...list];
    copy.sort((a,b)=>{
      switch (sortKey) {
        case "date": {
          const as = a.startDate.localeCompare(b.startDate);
          if (as !== 0) return sortDir==="asc" ? as : -as;
          const ae = a.endDate.localeCompare(b.endDate);
          return sortDir==="asc" ? ae : -ae;
        }
        case "employee": {
          const cmp = (a.userName||"").localeCompare(b.userName||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "company": {
          const cmp = (a.company||"").localeCompare(b.company||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "type": {
          const cmp = (a.type||"").localeCompare(b.type||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
        case "status": {
          const cmp = (a.status||"").localeCompare(b.status||"");
          return sortDir==="asc" ? cmp : -cmp;
        }
      }
    });
    return copy;
  }

  const reviewedSorted = useMemo(()=> sortReviewed(reviewed), [reviewed, sortKey, sortDir]);

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin?callbackUrl=/en/admin/vacation-requests');
      return;
    }

    // Check if user has admin access
    if (!session.user.email.endsWith('@stars.mc')) {
      console.error('Access denied. Only @stars.mc users can access this page.');
      return;
    }
  }, [session, status, router]);

  async function updateStatus(id: string, status: "approved"|"rejected") {
    try {
      const reviewer = {}; // TODO: fill with current admin identity from session
      const res = await fetch(`/api/vacation-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewer })
      });
      
      if (!res.ok) {
        alert("Failed to update status");
      } else {
        console.log(`✅ Successfully ${status} vacation request ${id}`);
        // Refresh the page to show updated data
        router.refresh();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert("Failed to update status");
    }
  }

  // Handle row click navigation
  const handleRowClick = (requestId: string) => {
    router.push(`/en/admin/vacation-requests/${requestId}`);
  };

  return (
    <div className="space-y-6">
      {/* Firebase Warning Banner */}
      {!isFirebaseEnabled() && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Firebase Disabled
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  ⚠️ Firebase is disabled or misconfigured. Check NEXT_PUBLIC_FIREBASE_* environment variables in .env.local.
                  <br />
                  <strong>Current status:</strong> {firebaseEnabled ? 'Enabled but misconfigured' : 'Disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Diagnostics Panel */}
      <FirebaseDebugPanel />
      
      {/* Development Diagnostics */}
      <FirebaseDiagnostics />

      {/* Breadcrumb and Page Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="text-sm text-gray-500 mb-2">
          <span>{t('breadcrumb')}</span> <span className="mx-1">/</span> <span className="text-gray-900 font-medium">{t('vacationRequestsTitle')}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('vacationRequestsTitle')}</h1>
            <p className="text-gray-600 mt-2">{t('vacationRequestsDescription')}</p>
            <p className="text-sm text-gray-500 mt-1">
              ✅ Conflicts scanned on load • {conflictCount} request{conflictCount === 1 ? '' : 's'} with conflicts
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.href = '/api/admin/export-reviewed-requests';
                link.download = `reviewed-vacation-requests-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Reviewed (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View with Conflict Detection */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">📅 {t('conflictDetection')}</h2>
              <p className="text-sm text-gray-600 mt-1">Visual overview of all vacation requests with conflict warnings</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                {pending.length} {t('pending').toLowerCase()} • {reviewed.length} {t('reviewed').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <UnifiedVacationCalendar 
            vacationRequests={initialRequests as any} 
            currentRequestId={undefined}
            showLegend={true}
            compact={false}
            data-testid="admin-calendar"
          />
        </div>
      </section>

      {/* Pending table with clickable rows */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('pending')} {t('vacationRequestsTitle')}</h2>
              <p className="text-sm text-gray-600 mt-1">Requests awaiting your approval or rejection • Click rows to view details</p>
            </div>
            <div className="flex items-center gap-3">
              {conflictCount > 0 && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  ⚠️ {conflictCount} {t('conflictsFound')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('employee')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('company')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('type')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dates')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('conflict')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.map(r => (
                <tr 
                  key={r.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(r.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link 
                      href={`/en/admin/vacation-requests/${r.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {r.userName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.company || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {r.startDate}{r.endDate!==r.startDate ? ` to ${r.endDate}` : ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {r.conflicts.length > 0 ? (
                        <>
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            ⚠️ {r.conflicts.length} conflict{r.conflicts.length > 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedConflictRequest(r.id);
                            }}
                            className="text-blue-600 hover:text-blue-800 text-xs underline"
                          >
                            {t('viewDetails')}
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          ✅ No conflicts
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(r.id, "approved");
                      }}
                      className="mr-2 rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 transition-colors text-xs"
                    >
                      {tVacations('approve')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(r.id, "rejected");
                      }}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700 transition-colors text-xs"
                    >
                      {tVacations('reject')}
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length===0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    <div className="text-center">
                      <div className="text-gray-400 text-4xl mb-2">🎉</div>
                      <p className="text-lg font-medium text-gray-900">{t('noPendingRequests')}</p>
                      <p className="text-sm text-gray-500">{t('allVacationRequestsReviewed')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviewed accordion */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('reviewed')}</h2>
              <p className="text-sm text-gray-600 mt-1">Requests that have been approved or rejected</p>
            </div>
            <button 
              onClick={()=>setShowReviewed(s=>!s)} 
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {showReviewed ? tCommon('hide') : tCommon('show')}
            </button>
          </div>
        </div>

        {showReviewed && (
          <div className="px-6 pb-6 space-y-4">
            {/* sort controls */}
            <div className="flex gap-3 items-center pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700">{t('sortBy')}</label>
              <select 
                value={sortKey} 
                onChange={e=>setSortKey(e.target.value as "date"|"employee"|"company"|"type"|"status")} 
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">{t('dates')}</option>
                <option value="employee">{tVacations('employee')}</option>
                <option value="company">{tVacations('company')}</option>
                <option value="type">{tVacations('type')}</option>
                <option value="status">{tVacations('status')}</option>
              </select>
              <button 
                onClick={()=>setSortDir(d=> d==="asc" ? "desc" : "asc")} 
                className="border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-50 transition-colors"
              >
                {sortDir==="asc" ? `↑ ${tCommon('ascending')}` : `↓ ${tCommon('descending')}`}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('employee')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('company')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('type')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('dates')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{tVacations('status')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('reviewedAt')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviewedSorted.map(r=>(
                    <tr 
                      key={r.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(r.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link 
                          href={`/en/admin/vacation-requests/${r.id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {r.userName}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.company || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.type || "—"}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {r.startDate}{r.endDate!==r.startDate ? ` to ${r.endDate}` : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          r.status?.toLowerCase() === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                        {r.reviewedBy?.name || 'Admin'}
                      </td>
                    </tr>
                  ))}
                  {reviewedSorted.length===0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                        <div className="text-center">
                          <div className="text-gray-400 text-4xl mb-2">📋</div>
                          <p className="text-lg font-medium text-gray-900">{t('noReviewedRequests')}</p>
                          <p className="text-sm text-gray-500">Start reviewing pending requests above</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Conflict Details Drawer */}
      {selectedConflictRequest && (
        <ConflictDetailsDrawer
          isOpen={!!selectedConflictRequest}
          onClose={() => setSelectedConflictRequest(null)}
          conflicts={pending.find(r => r.id === selectedConflictRequest)?.conflicts || []}
          requestId={selectedConflictRequest}
        />
      )}
    </div>
  );
}
