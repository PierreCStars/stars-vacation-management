"use client";
import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { VacationRequestWithConflicts } from '@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts';
import { absoluteUrl } from '@/lib/urls';
import { isPendingStatus, isReviewedStatus, normalizeVacationStatus } from '@/types/vacation-status';
import { VacationRequest } from '@/types/vacation';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';

export default function AdminPendingRequestsV2() {
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<VacationRequestWithConflicts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [showReviewed, setShowReviewed] = useState(false);
  const [sortKey, setSortKey] = useState<'userName' | 'company' | 'startDate' | 'reviewedAt'>('startDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const { data: session } = useSession();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tVacations = useTranslations('vacations');

  useEffect(() => { 
    setMounted(true);
    
    // Fetch vacation requests
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('[V2] Failed to fetch vacation requests:', response.status);
      }
    } catch (error) {
      console.error('[V2] Error fetching vacation requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "denied") => {
    setProcessingRequests(prev => new Set(prev).add(id));
    setActionMessage(null); // Clear previous messages
    
    try {
      const requestPayload = {
        status,
        reviewerName: session?.user?.name || 'Admin',
        reviewerEmail: session?.user?.email || 'admin@stars.mc',
        adminComment: status === 'approved' ? 'Approved via admin panel' : 'Rejected via admin panel'
      };
      
      const response = await fetch(`/api/vacation-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Update the request status locally
        setRequests(prev => {
          const updated = prev.map(req => 
            req.id === id 
              ? { 
                  ...req, 
                  status: status, // Keep lowercase to match API
                  reviewedAt: new Date().toISOString(),
                  reviewedBy: {
                    name: session?.user?.name || 'Admin',
                    email: session?.user?.email || 'admin@stars.mc'
                  }
                }
              : req
          );
          return updated;
        });
        
        // Show success message
        setActionMessage({
          type: 'success',
          message: `Request ${status === 'approved' ? 'approved' : 'denied'} successfully!`
        });
        
        // Auto-hide message after 3 seconds
        setTimeout(() => setActionMessage(null), 3000);
        
        // Refetch data to ensure consistency with server
        setTimeout(() => {
          fetchVacationRequests();
        }, 1000);
      } else {
        const errorText = await response.text();
        setActionMessage({
          type: 'error',
          message: `Failed to ${status} request: ${response.status} ${errorText}`
        });
        console.error(`[V2] Failed to ${status} request:`, response.status);
      }
    } catch (error) {
      setActionMessage({
        type: 'error',
        message: `Error ${status} request: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      console.error(`[V2] Error ${status} request:`, error);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const toggleRequestSelection = (id: string) => {
    setSelectedRequests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCSVExport = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setActionMessage(null);
    
    try {
      const response = await fetch('/api/analytics/vacations.csv?status=all');
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }
      
      // Get the CSV content
      const csvContent = await response.text();
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `vacation-requests-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setActionMessage({
        type: 'success',
        message: 'CSV export completed successfully!'
      });
      
      setTimeout(() => setActionMessage(null), 3000);
      
    } catch (error) {
      console.error('CSV export error:', error);
      setActionMessage({
        type: 'error',
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const isProcessing = (id: string) => processingRequests.has(id);
  
  // Filter requests by status
  const pendingRequests = requests.filter(req => isPendingStatus(req.status));
  const reviewedRequests = requests.filter(req => isReviewedStatus(req.status));
  
  
  // Sorting function
  const sortRequests = (list: VacationRequestWithConflicts[]) => {
    const sorted = [...list];
    sorted.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      
      if (sortKey === 'userName' || sortKey === 'company') {
        const aVal = a[sortKey] || '';
        const bVal = b[sortKey] || '';
        return aVal.localeCompare(bVal) * dir;
      }
      
      if (sortKey === 'startDate') {
        const aDate = new Date(a.startDate);
        const bDate = new Date(b.startDate);
        return (aDate.getTime() - bDate.getTime()) * dir;
      }
      
      if (sortKey === 'reviewedAt') {
        const aDate = a.reviewedAt ? new Date(a.reviewedAt) : new Date(0);
        const bDate = b.reviewedAt ? new Date(b.reviewedAt) : new Date(0);
        return (aDate.getTime() - bDate.getTime()) * dir;
      }
      
      return 0;
    });
    return sorted;
  };
  
  const pendingSorted = useMemo(() => sortRequests(pendingRequests), [pendingRequests, sortKey, sortDir]);
  const reviewedSorted = useMemo(() => sortRequests(reviewedRequests), [reviewedRequests, sortKey, sortDir]);

  if (!mounted) {
    return (
      <div data-test="pending-list-v2" className="p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div data-test="pending-list-v2" className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('vacationRequestsTitle')}
        </h1>
        <p className="text-gray-600">
          {t('vacationRequestsDescription')}
        </p>
      </div>

      {/* Action Message */}
      {actionMessage && (
        <div className={`mb-4 p-4 rounded-lg ${
          actionMessage.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {actionMessage.type === 'success' ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{actionMessage.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Pending Requests</div>
          <div className="text-2xl font-bold text-orange-600">{pendingRequests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Total Requests</div>
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm font-medium text-gray-500">Selected</div>
          <div className="text-2xl font-bold text-purple-600">{selectedRequests.size}</div>
        </div>
      </div>

              {/* Pending Requests Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      📝 Pending Requests ({pendingRequests.length})
                    </h2>
                    {pendingRequests.length > 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Review and approve or deny vacation requests
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCSVExport}
                      disabled={isExporting || requests.length === 0}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isExporting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full mr-2"></div>
                          Exporting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Export CSV
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

      {/* Pending Requests Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600">Loading vacation requests...</p>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
          <p className="text-gray-600">All vacation requests have been reviewed.</p>
        </div>
      ) : (
        <RequestsTable 
          requests={pendingSorted}
          selectedRequests={selectedRequests}
          onToggleSelection={toggleRequestSelection}
          onStatusUpdate={handleStatusUpdate}
          isProcessing={isProcessing}
          showActions={true}
          t={t}
          tCommon={tCommon}
          tVacations={tVacations}
        />
      )}

              {/* Calendar View with Conflict Detection */}
              <div className="mt-8">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      🗓️ Vacation Calendar & Conflict Detection
                    </h2>
                    <p className="text-sm text-gray-600">
                      This calendar shows all vacation requests with company colors and conflict warnings. 
                      Look for dates with multiple people requesting time off.
                    </p>
                  </div>
                  
                  {isLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin mx-auto h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
                      <p className="text-gray-600">Loading calendar...</p>
                    </div>
                  ) : (
                    <UnifiedVacationCalendar 
                      vacationRequests={requests
                        .filter(r => normalizeVacationStatus(r.status) === 'approved')
                        .map((r): VacationRequest => ({
                          id: r.id,
                          userId: r.userId,
                          userEmail: r.userEmail,
                          userName: r.userName,
                          startDate: r.startDate,
                          endDate: r.endDate,
                          reason: r.reason,
                          company: r.company || 'Unknown',
                          type: r.type || 'VACATION',
                          status: normalizeVacationStatus(r.status),
                          createdAt: r.createdAt || new Date().toISOString(),
                          reviewedBy: r.reviewedBy?.name,
                          reviewerEmail: r.reviewedBy?.email,
                          reviewedAt: r.reviewedAt || undefined, // Convert null to undefined
                          adminComment: undefined,
                          included: true,
                          openDays: undefined,
                          isHalfDay: r.isHalfDay,
                          halfDayType: (r.halfDayType as 'morning' | 'afternoon' | null) || null,
                          durationDays: r.durationDays,
                          googleEventId: undefined
                        }))}
                      className="w-full"
                      showLegend={true}
                      compact={false}
                      data-testid="admin-calendar"
                    />
                  )}
                </div>
              </div>

              {/* Reviewed Requests - Foldable Section */}
              {reviewedRequests.length > 0 && (
                <div className="mt-8">
                  <div className="bg-white rounded-lg shadow-sm border">
                    <button
                      onClick={() => setShowReviewed(!showReviewed)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                          📋 Reviewed Requests
                        </h2>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {reviewedRequests.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {showReviewed ? 'Hide' : 'Show'} reviewed requests
                        </span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            showReviewed ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>
                    
                    {showReviewed && (
                      <div className="border-t border-gray-200">
                        <ReviewedRequestsTable 
                          requests={reviewedSorted}
                          selectedRequests={selectedRequests}
                          onToggleSelection={toggleRequestSelection}
                          t={t}
                          tCommon={tCommon}
                          tVacations={tVacations}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

    </div>
  );
}

// Pending Requests Table Component
function RequestsTable({ 
  requests, 
  selectedRequests, 
  onToggleSelection, 
  onStatusUpdate, 
  isProcessing, 
  showActions,
  t, 
  tCommon, 
  tVacations 
}: {
  requests: VacationRequestWithConflicts[];
  selectedRequests: Set<string>;
  onToggleSelection: (id: string) => void;
  onStatusUpdate: (id: string, status: "approved" | "denied") => void;
  isProcessing: (id: string) => boolean;
  showActions: boolean;
  t: any;
  tCommon: any;
  tVacations: any;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedRequests.size === requests.length && requests.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      requests.forEach(req => onToggleSelection(req.id));
                    } else {
                      requests.forEach(req => onToggleSelection(req.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('employee')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('dates')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('conflict')}
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelection(request.id);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{request.userName}</span>
                    <a
                      href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm"
                      aria-label={`More information about ${request.userName}'s request`}
                      data-test="more-info-link"
                    >
                      More Information
                    </a>
                  </div>
                  <div className="text-sm text-gray-500">{request.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{request.startDate}</div>
                    <div className="text-gray-500">to {request.endDate}</div>
                    <div className="text-xs text-gray-400">{request.durationDays} days</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {request.conflicts && request.conflicts.length > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {request.conflicts.length} conflicts
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      No conflicts
                    </span>
                  )}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(request.id, 'approved');
                        }}
                        disabled={isProcessing(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-test="approve-btn"
                      >
                        {isProcessing(request.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          tVacations('approve')
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusUpdate(request.id, 'denied');
                        }}
                        disabled={isProcessing(request.id)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        data-test="reject-btn"
                      >
                        {isProcessing(request.id) ? (
                          <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                          tVacations('reject')
                        )}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {requests.map((request) => (
          <div key={request.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedRequests.has(request.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(request.id);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-medium text-gray-900 truncate">
                    {request.userName}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {request.company || "—"} • {request.type || "—"}
                  </p>
                  <a
                    href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm mt-2"
                    aria-label={`More information about ${request.userName}'s request`}
                    data-test="more-info-link"
                  >
                    More Information
                  </a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Start Date</div>
                <div className="text-sm text-gray-900">{request.startDate}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">End Date</div>
                <div className="text-sm text-gray-900">{request.endDate}</div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Duration</div>
              <div className="text-sm text-gray-900">{request.durationDays} days</div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Conflicts</div>
              {request.conflicts && request.conflicts.length > 0 ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {request.conflicts.length} conflicts
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  No conflicts
                </span>
              )}
            </div>
            
            {showActions && (
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStatusUpdate(request.id, 'approved');
                  }}
                  disabled={isProcessing(request.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-test="approve-btn"
                >
                  {isProcessing(request.id) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    tVacations('approve')
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                     onStatusUpdate(request.id, 'denied');
                  }}
                  disabled={isProcessing(request.id)}
                  className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  data-test="reject-btn"
                >
                  {isProcessing(request.id) ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    tVacations('reject')
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Reviewed Requests Table Component
function ReviewedRequestsTable({ 
  requests, 
  selectedRequests, 
  onToggleSelection, 
  t, 
  tCommon, 
  tVacations 
}: {
  requests: VacationRequestWithConflicts[];
  selectedRequests: Set<string>;
  onToggleSelection: (id: string) => void;
  t: any;
  tCommon: any;
  tVacations: any;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={selectedRequests.size === requests.length && requests.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      requests.forEach(req => onToggleSelection(req.id));
                    } else {
                      requests.forEach(req => onToggleSelection(req.id));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('employee')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tVacations('type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {tCommon('dates')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('reviewedAt')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedRequests.has(request.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelection(request.id);
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{request.userName}</span>
                    <a
                      href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm"
                      aria-label={`More information about ${request.userName}'s request`}
                      data-test="more-info-link"
                    >
                      More Information
                    </a>
                  </div>
                  <div className="text-sm text-gray-500">{request.company}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {request.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">{request.startDate}</div>
                    <div className="text-gray-500">to {request.endDate}</div>
                    <div className="text-xs text-gray-400">{request.durationDays} days</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    request.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div className="font-medium">
                      {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '—'}
                    </div>
                    <div className="text-xs text-gray-500">
                      by {request.reviewedBy?.name || 'Admin'}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {requests.map((request) => (
          <div key={request.id} className="border-b border-gray-200 p-4 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedRequests.has(request.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelection(request.id);
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-lg font-medium text-gray-900 truncate">
                    {request.userName}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {request.company || "—"} • {request.type || "—"}
                  </p>
                  <a
                    href={absoluteUrl(`/en/admin/vacation-requests/${request.id}`)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 hover:text-white transition-colors shadow-sm mt-2"
                    aria-label={`More information about ${request.userName}'s request`}
                    data-test="more-info-link"
                  >
                    More Information
                  </a>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="text-sm font-medium text-gray-500">Start Date</div>
                <div className="text-sm text-gray-900">{request.startDate}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">End Date</div>
                <div className="text-sm text-gray-900">{request.endDate}</div>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Duration</div>
              <div className="text-sm text-gray-900">{request.durationDays} days</div>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Status</div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                request.status === 'approved' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {request.status}
              </span>
            </div>
            
            <div className="mb-3">
              <div className="text-sm font-medium text-gray-500">Reviewed</div>
              <div className="text-sm text-gray-900">
                {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : '—'}
              </div>
              <div className="text-xs text-gray-500">
                by {request.reviewedBy?.name || 'Admin'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
