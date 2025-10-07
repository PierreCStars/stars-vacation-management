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
import ResponsiveRequestsList from '@/components/admin/ResponsiveRequestsList';
import { isPendingStatus, isReviewedStatus } from '@/types/vacation-status';

// Handle browser extension interference - moved to useEffect

interface AdminVacationRequestsClientProps {
  initialRequests: VacationRequestWithConflicts[];
  pending: VacationRequestWithConflicts[];
  reviewed: VacationRequestWithConflicts[];
  conflictCount: number;
  version?: string;
}

export default function AdminVacationRequestsClient({ 
  initialRequests, 
  pending, 
  reviewed, 
  conflictCount,
  version
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
  const [isLoading, setIsLoading] = useState(false);
  const [clientRequests, setClientRequests] = useState<VacationRequestWithConflicts[]>([]);
  const [clientPending, setClientPending] = useState<VacationRequestWithConflicts[]>([]);
  const [clientReviewed, setClientReviewed] = useState<VacationRequestWithConflicts[]>([]);
  const [clientConflictCount, setClientConflictCount] = useState(0);
  
  // New state for tab management
  const [activeTab, setActiveTab] = useState<"list" | "actions">("list");
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());

  // Handle browser extension interference and unhandled promise rejections
  useEffect(() => {
    console.log('[HYDRATION] AdminVacationRequestsClient mounted');
    
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

  // Client-side data fetching fallback
  useEffect(() => {
    // If we have no server-side data, try to fetch it client-side
    if (initialRequests.length === 0 && !isLoading) {
      console.log('[CLIENT] No server-side data, fetching client-side...');
      setIsLoading(true);
      
      fetch('/api/vacation-requests')
        .then(response => response.json())
        .then(data => {
          console.log(`[CLIENT] Fetched ${data.length} requests client-side`);
          const requests = data.map((request: any) => ({
            ...request,
            conflicts: [] // No conflicts computed client-side
          }));
          
          const pending = requests.filter((r: any) => isPendingStatus(r.status));
          const reviewed = requests.filter((r: any) => isReviewedStatus(r.status));
          const conflictCount = requests.filter((r: any) => r.conflicts?.length > 0).length;
          
          setClientRequests(requests);
          setClientPending(pending);
          setClientReviewed(reviewed);
          setClientConflictCount(conflictCount);
        })
        .catch(error => {
          console.error('[CLIENT] Failed to fetch data:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [initialRequests.length, isLoading]);

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

  // Use client-side data if server-side data is not available
  const effectiveRequests = clientRequests.length > 0 ? clientRequests : initialRequests;
  const effectivePending = clientPending.length > 0 ? clientPending : pending;
  const effectiveReviewed = clientReviewed.length > 0 ? clientReviewed : reviewed;
  const effectiveConflictCount = clientConflictCount > 0 ? clientConflictCount : conflictCount;

  const reviewedSorted = useMemo(()=> sortReviewed(effectiveReviewed), [effectiveReviewed, sortKey, sortDir]);

  // Handle authentication
  useEffect(() => {
    console.log('🔐 Client-side session check:', { 
      status, 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      email: session?.user?.email,
      initialRequestsLength: initialRequests.length
    });
    
    if (status === 'loading') {
      console.log('⏳ Session still loading...');
      return;
    }

    if (!session?.user?.email) {
      console.log('❌ No client session, redirecting to signin');
      router.push('/auth/signin?callbackUrl=/en/admin/vacation-requests');
      return;
    }

    // Check if user has admin access
    if (!session.user.email.endsWith('@stars.mc')) {
      console.error('❌ Access denied. Only @stars.mc users can access this page.');
      return;
    }
    
    console.log('✅ Client session authenticated:', session.user.email);
  }, [session, status, router, initialRequests.length]);

  // Show loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isLoading ? 'Loading vacation requests...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  async function updateStatus(id: string, status: "approved"|"rejected") {
    try {
      
      const reviewer = {
        id: session?.user?.email || 'unknown',
        name: session?.user?.name || session?.user?.email || 'Admin',
        email: session?.user?.email || 'unknown@stars.mc'
      };
      
      const res = await fetch(`/api/vacation-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewer })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('[VALIDATION] error', { id, status, error: errorData });
        alert(`Failed to update status: ${errorData.error || 'Unknown error'}`);
        return;
      }
      
      const result = await res.json();
      console.log('[VALIDATION] success', { id, status, result });
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('[VALIDATION] fatal', { id, status, error: error instanceof Error ? error.message : String(error) });
      alert("Failed to update status");
    }
  }

  // Handle row click navigation
  const handleRowClick = (requestId: string) => {
    router.push(`/en/admin/vacation-requests/${requestId}`);
  };

  // Handle request selection for actions tab
  const toggleRequestSelection = (requestId: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(requestId)) {
        newSet.delete(requestId);
      } else {
        newSet.add(requestId);
      }
      return newSet;
    });
  };

  const selectAllRequests = () => {
    setSelectedRequests(new Set(effectivePending.map(r => r.id)));
  };

  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  // Handle bulk actions
  const handleBulkAction = async (action: "approved" | "rejected") => {
    if (selectedRequests.size === 0) return;
    
    const reviewer = {
      name: session?.user?.name || 'Admin',
      email: session?.user?.email || 'admin@stars.mc'
    };

    for (const requestId of selectedRequests) {
      await updateStatus(requestId, action);
    }
    
    // Clear selection after bulk action
    setSelectedRequests(new Set());
  };

  const commit = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'dev';

  return (
    <div className="space-y-6">
      {/* Critical debug banner - should be visible even without JS */}
      <div 
        data-test="debug-banner" 
        className="fixed top-4 left-4 z-[9999] px-4 py-2 rounded bg-red-600 text-white text-sm font-bold border-2 border-yellow-400"
        style={{ position: 'fixed', top: '16px', left: '16px', zIndex: 9999 }}
      >
        🚨 HYDRATION TEST: AdminVacationRequestsClient RENDERED
      </div>
      
      {/* Server-side debug banner */}
      <div className="bg-green-100 border-b border-green-400 text-green-800 px-4 py-2 text-sm font-bold">
        ✅ AdminVacationRequestsClient RENDERED - {initialRequests.length} requests, {pending.length} pending, {reviewed.length} reviewed
      </div>
      
      {/* Session debug banner */}
      <div 
        data-test="session-debug" 
        className="fixed top-16 left-4 z-[9999] px-4 py-2 rounded bg-blue-600 text-white text-sm font-bold border-2 border-yellow-400"
        style={{ position: 'fixed', top: '64px', left: '16px', zIndex: 9999 }}
      >
        🔐 SESSION: {status} | {session?.user?.email || 'No email'} | Requests: {initialRequests.length}
      </div>
      
      {/* Secondary debug banner */}
      <div 
        data-test="debug-banner-2" 
        className="fixed bottom-2 right-2 z-[9999] px-3 py-1 rounded bg-fuchsia-600 text-white text-xs"
      >
        Admin Pending Layout v2 • {version || 'no-ver'}
      </div>
      
      {/* Version tag */}
      <div className="text-xs text-gray-500 text-right">
        Build: <span data-test="build-commit">{commit.slice(0,7)}</span>
      </div>
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
              ✅ Conflicts scanned on load • {effectiveConflictCount} request{effectiveConflictCount === 1 ? '' : 's'} with conflicts
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
                {effectivePending.length} {t('pending').toLowerCase()} • {effectiveReviewed.length} {t('reviewed').toLowerCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="p-6">
          <UnifiedVacationCalendar 
            vacationRequests={effectiveRequests.filter(r => r.status?.toLowerCase() === 'approved') as any} 
            currentRequestId={undefined}
            showLegend={true}
            compact={false}
            data-testid="admin-calendar"
          />
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("list")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "list"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              📋 {t('pending')} {t('vacationRequestsTitle')} ({effectivePending.length})
            </button>
            <button
              onClick={() => setActiveTab("actions")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "actions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              ⚡ {t('actions')} ({selectedRequests.size} selected)
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Debug info */}
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded text-sm mb-4">
            🔧 DEBUG: activeTab = "{activeTab}", effectivePending.length = {effectivePending.length}
          </div>
          
          {activeTab === "list" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Click "Review Request" to view details • Select requests for bulk actions</p>
                </div>
                <div className="flex items-center gap-3">
                  {effectiveConflictCount > 0 && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                      ⚠️ {effectiveConflictCount} {t('conflictsFound')}
                    </span>
                  )}
                </div>
              </div>
              {/* Debug before ResponsiveRequestsList */}
              <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded text-sm mb-4">
                🔧 DEBUG: About to render ResponsiveRequestsList with {effectivePending.length} requests
              </div>
              
              {/* Temporary simple test */}
              <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded text-sm mb-4">
                ✅ TEST: This should be visible if the component is rendering
              </div>
              
              {/* Simple test replacement */}
              <div className="bg-purple-100 border border-purple-400 text-purple-800 px-4 py-2 rounded text-sm mb-4">
                🧪 TEST: Simple div replacement for ResponsiveRequestsList
              </div>
              
              <ResponsiveRequestsList
                requests={effectivePending}
                onUpdateStatus={updateStatus}
                onViewConflicts={(id) => setSelectedConflictRequest(id)}
                onReviewRequest={handleRowClick}
                onToggleSelection={toggleRequestSelection}
                selectedRequests={selectedRequests}
                t={t}
                tVacations={tVacations}
                showActions={false}
              />
            </div>
          )}

          {activeTab === "actions" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Bulk Actions</h3>
                  <p className="text-sm text-gray-600">Select requests from the list tab, then perform bulk actions here</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllRequests}
                    className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>

              {selectedRequests.size === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-lg font-medium text-gray-900">No requests selected</p>
                  <p className="text-sm text-gray-500">Go to the list tab to select requests for bulk actions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>{selectedRequests.size}</strong> request{selectedRequests.size === 1 ? '' : 's'} selected
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleBulkAction("approved")}
                      className="flex-1 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 font-medium transition-colors"
                    >
                      ✅ Approve All Selected ({selectedRequests.size})
                    </button>
                    <button
                      onClick={() => handleBulkAction("rejected")}
                      className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 font-medium transition-colors"
                    >
                      ❌ Reject All Selected ({selectedRequests.size})
                    </button>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>⚠️ This will apply the action to all selected requests. This action cannot be undone.</p>
                  </div>
                </div>
              )}
            </div>
          )}
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
console.log('NEW LAYOUT LOADED:', new Date().toISOString());
