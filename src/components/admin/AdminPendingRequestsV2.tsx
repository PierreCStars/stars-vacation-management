"use client";
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { VacationRequestWithConflicts } from '@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts';
import { absoluteUrl } from '@/lib/urls';

export default function AdminPendingRequestsV2() {
  const [mounted, setMounted] = useState(false);
  const [requests, setRequests] = useState<VacationRequestWithConflicts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  
  const { data: session } = useSession();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tVacations = useTranslations('vacations');

  useEffect(() => { 
    console.log("[HYDRATION] AdminPendingV2 mounted - REAL LAYOUT");
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
        console.log('[V2] Fetched', data.length, 'vacation requests');
      } else {
        console.error('[V2] Failed to fetch vacation requests:', response.status);
      }
    } catch (error) {
      console.error('[V2] Error fetching vacation requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setProcessingRequests(prev => new Set(prev).add(id));
    try {
      const response = await fetch(`/api/vacation-requests/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          reviewerName: session?.user?.name || 'Admin',
          reviewerEmail: session?.user?.email || 'admin@stars.mc',
          adminComment: status === 'approved' ? 'Approved via admin panel' : 'Rejected via admin panel'
        }),
      });

      if (response.ok) {
        // Update the request status locally
        setRequests(prev => prev.map(req => 
          req.id === id 
            ? { ...req, status: status.toUpperCase() as any, reviewedAt: new Date().toISOString() }
            : req
        ));
        console.log(`[V2] Successfully ${status} request ${id}`);
      } else {
        console.error(`[V2] Failed to ${status} request:`, response.status);
      }
    } catch (error) {
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

  const isProcessing = (id: string) => processingRequests.has(id);
  const pendingRequests = requests.filter(req => req.status === 'pending');

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
          <div className="text-2xl font-bold text-green-600">{selectedRequests.size}</div>
        </div>
      </div>

      {/* Requests Table */}
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
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRequests.size === pendingRequests.length && pendingRequests.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRequests(new Set(pendingRequests.map(req => req.id)));
                        } else {
                          setSelectedRequests(new Set());
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={selectedRequests.has(request.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleRequestSelection(request.id);
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(request.id, 'approved');
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
                            handleStatusUpdate(request.id, 'rejected');
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden">
            {pendingRequests.map((request) => (
              <div key={request.id} className="border-b border-gray-200 p-4 last:border-b-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedRequests.has(request.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleRequestSelection(request.id);
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
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(request.id, 'approved');
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
                      handleStatusUpdate(request.id, 'rejected');
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
          <div className="font-mono">
            <div>Mounted: {mounted ? 'Yes' : 'No'}</div>
            <div>Requests: {requests.length}</div>
            <div>Pending: {pendingRequests.length}</div>
            <div>Selected: {selectedRequests.size}</div>
          </div>
        </div>
      )}
    </div>
  );
}
