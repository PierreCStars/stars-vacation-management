'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import { VacationRequest } from '@/types/vacation';
import { normalizeVacationStatus } from '@/types/vacation-status';
// import PageHeader from '@/components/ui/PageHeader';
// import Card from '@/components/ui/Card';
// import Badge from '@/components/ui/Badge';

interface ConflictEvent {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  status: string;
  type: string;
  isHalfDay: boolean;
  halfDayType: string | null;
  reason?: string;
  company: string;
  createdAt: string;
}

export default function VacationRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const [vacationRequest, setVacationRequest] = useState<VacationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ConflictEvent[]>([]);
  const [conflictsLoading, setConflictsLoading] = useState(false);
  const [allVacationRequests, setAllVacationRequests] = useState<VacationRequest[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Use next-intl translations
  const t = useTranslations('admin');
  const tVacations = useTranslations('vacations');

  const requestId = params?.id as string;

  // Function to fetch conflicts for the current request
  const fetchConflicts = async (request: VacationRequest) => {
    try {
      setConflictsLoading(true);
      const url = `/api/conflicts/vacation?company=${encodeURIComponent(request.company)}&start=${request.startDate}&end=${request.endDate}&id=${request.id}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setConflicts(data.conflicts || []);
      } else {
        console.error('Failed to fetch conflicts:', response.status);
        setConflicts([]);
      }
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      setConflicts([]);
    } finally {
      setConflictsLoading(false);
    }
  };

  // Function to fetch all vacation requests for the calendar
  const fetchAllVacationRequests = async () => {
    try {
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        const transformedData = Array.isArray(data) ? data.map((r: any): VacationRequest => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          userName: r.userName,
          startDate: r.startDate,
          endDate: r.endDate,
          reason: r.reason || '',
          company: r.company || 'Unknown',
          type: r.type || 'VACATION',
          status: normalizeVacationStatus(r.status),
          createdAt: r.createdAt || new Date().toISOString(),
          reviewedBy: r.reviewedBy?.name,
          reviewerEmail: r.reviewedBy?.email,
          reviewedAt: r.reviewedAt || undefined,
          adminComment: r.adminComment,
          included: r.included,
          openDays: r.openDays,
          isHalfDay: r.isHalfDay || false,
          halfDayType: (r.halfDayType as 'morning' | 'afternoon' | null) || null,
          durationDays: r.durationDays || 0,
          googleEventId: r.googleEventId
        })) : [];
        setAllVacationRequests(transformedData);
      } else {
        console.error('Failed to fetch all vacation requests:', response.status);
        setAllVacationRequests([]);
      }
    } catch (error) {
      console.error('Error fetching all vacation requests:', error);
      setAllVacationRequests([]);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Starting fetch for vacation request:', requestId);
        setLoading(true);
        setError(null); // Clear any previous errors
        
        const url = '/api/vacation-requests';
        console.log('📡 Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('📊 Response status:', response.status);
        console.log('📊 Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Raw API response:', data);
          
          // API now always returns an array
          const requests = Array.isArray(data) ? data : [];
          console.log('📋 Total requests found:', requests.length);
          console.log('🔍 Available request IDs:', requests.map(r => r.id));
          
          const request = requests.find((req: VacationRequest) => req.id === requestId);
          console.log('🎯 Found request:', request);
          
          if (request) {
            console.log('✅ Setting vacation request in state:', request);
            setVacationRequest(request);
            // Fetch conflicts and all vacation requests for the calendar
            await Promise.all([
              fetchConflicts(request),
              fetchAllVacationRequests()
            ]);
          } else {
            console.log('❌ Request not found for ID:', requestId);
            setError(`Vacation request with ID "${requestId}" not found`);
          }
        } else {
          console.log('❌ API response not ok:', response.status, response.statusText);
          setError(`Failed to fetch vacation request: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('💥 Fetch error:', error);
        setError(`Error fetching vacation request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        console.log('🏁 Fetch operation completed, setting loading to false');
        setLoading(false);
      }
    };

    if (requestId) {
      console.log('🚀 useEffect triggered with requestId:', requestId);
      // Force a timeout to ensure the component doesn't get stuck
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout reached, forcing loading to false');
        setLoading(false);
        if (!vacationRequest && !error) {
          setError('Request timed out - please refresh the page');
        }
      }, 10000); // 10 second timeout
      
      fetchData().finally(() => {
        clearTimeout(timeoutId);
      });
    } else {
      console.log('⚠️ No requestId available');
      setError('No request ID provided');
      setLoading(false);
    }
  }, [requestId]);

  // Show toast message
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Handle status update (approve/reject)
  const handleStatusUpdate = async (newStatus: 'approved' | 'denied') => {
    if (!vacationRequest || actionLoading) return;
    
    startTransition(async () => {
      try {
        setActionLoading(true);
        
        const response = await fetch(`/api/vacation-requests/${vacationRequest.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            adminComment: `Request ${newStatus} by admin`
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${newStatus} request`);
        }

        const result = await response.json();
        console.log(`✅ Request ${newStatus} successfully:`, result);

        // Show success toast
        showToast(`Request ${newStatus} successfully!`, 'success');

        // Redirect back to admin list after a short delay
        setTimeout(() => {
          router.push('/en/admin/vacation-requests');
          router.refresh(); // Ensure list is up-to-date
        }, 1000);

      } catch (error) {
        console.error(`❌ Error ${newStatus} request:`, error);
        showToast(`Failed to ${newStatus} request: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setActionLoading(false);
      }
    });
  };

  // Handle date update
  const handleDateUpdate = async (newStartDate: string, newEndDate: string) => {
    if (!vacationRequest || actionLoading) return;
    
    startTransition(async () => {
      try {
        setActionLoading(true);
        
        // Calculate new duration
        const startDate = new Date(newStartDate);
        const endDate = new Date(newEndDate);
        const timeDiff = endDate.getTime() - startDate.getTime();
        const millisecondsPerDay = 1000 * 3600 * 24;
        const durationDays = Math.ceil(timeDiff / millisecondsPerDay) + 1;

        const response = await fetch(`/api/vacation-requests/${vacationRequest.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: newStartDate,
            endDate: newEndDate,
            durationDays: durationDays,
            adminComment: 'Dates updated by admin'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update dates');
        }

        const result = await response.json();
        console.log('✅ Dates updated successfully:', result);

        // Show success toast
        showToast('Dates updated successfully!', 'success');

        // Redirect back to admin list after a short delay
        setTimeout(() => {
          router.push('/en/admin/vacation-requests');
          router.refresh(); // Ensure list is up-to-date
        }, 1000);

      } catch (error) {
        console.error('❌ Error updating dates:', error);
        showToast(`Failed to update dates: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      } finally {
        setActionLoading(false);
      }
    });
  };

  const handleRetry = () => {
    console.log('🔄 Retrying fetch for request:', requestId);
    setLoading(true);
    setError(null);
    setVacationRequest(null);
    
    // Trigger useEffect again
    const fetchData = async () => {
      try {
        console.log('🔄 Retry: Starting fetch for vacation request:', requestId);
        setLoading(true);
        setError(null);
        
        const url = '/api/vacation-requests';
        console.log('🔄 Retry: Fetching from URL:', url);
        
        const response = await fetch(url);
        console.log('🔄 Retry: Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔄 Retry: Raw API response:', data);
          
          const requests = Array.isArray(data) ? data : [];
          console.log('🔄 Retry: Total requests found:', requests.length);
          
          const request = requests.find((req: VacationRequest) => req.id === requestId);
          console.log('🔄 Retry: Found request:', request);
          
          if (request) {
            console.log('🔄 Retry: Setting vacation request in state:', request);
            setVacationRequest(request);
          } else {
            console.log('🔄 Retry: Request not found for ID:', requestId);
            setError(`Vacation request with ID "${requestId}" not found`);
          }
        } else {
          console.log('🔄 Retry: API response not ok:', response.status, response.statusText);
          setError(`Failed to fetch vacation request: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.error('🔄 Retry: Fetch error:', error);
        setError(`Error fetching vacation request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        console.log('🔄 Retry: Fetch operation completed, setting loading to false');
        setLoading(false);
      }
    };

    fetchData();
  };

  const handleUseMockData = () => {
    console.log('🎭 Using mock data as fallback for request:', requestId);
    setLoading(false);
    setError(null);
    
    // Use mock data directly as fallback
    const mockRequest: VacationRequest = {
      id: requestId,
      userId: 'mock-user-123',
      userName: 'Test User (Mock)',
      userEmail: 'test@example.com',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      reason: 'Annual vacation',
      company: 'Stars Yachting',
      type: 'Full day',
      status: 'pending',
      isHalfDay: false,
      halfDayType: null,
      durationDays: 3,
      createdAt: '2025-01-08T10:00:00Z'
    };
    
    setVacationRequest(mockRequest);
  };

  // Debug logging for component state
  console.log('🔍 Component render state:', {
    requestId,
    loading,
    error,
    hasVacationRequest: !!vacationRequest,
    vacationRequestData: vacationRequest
  });

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vacation request...</p>
          <p className="text-sm text-gray-500 mt-2">Request ID: {requestId}</p>
          <p className="text-sm text-gray-500">Loading state: {loading.toString()}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">Error Loading Request</h2>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-2 text-red-600">Check the browser console for more details.</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
          <button
            onClick={handleUseMockData}
            className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Use Mock Data (Debug)
          </button>
          <button
            onClick={() => router.push('/en/admin/vacation-requests')}
            className="ml-4 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Back to All Requests
          </button>
        </div>
      </div>
    );
  }

  if (!vacationRequest) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <h2 className="text-lg font-semibold mb-2">No Request Found</h2>
            <p className="text-sm">The vacation request could not be loaded.</p>
            <p className="text-xs mt-2 text-yellow-600">Request ID: {requestId}</p>
          </div>
          <button
            onClick={() => router.push('/en/admin/vacation-requests')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to All Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
          {/* Simple Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{t('vacationRequestDetails')}</h1>
          </div>

          {/* Page Header */}
          {/* <PageHeader 
            title={t('vacationRequestDetails')}
            description={`Reviewing request from ${vacationRequest.userName}`}
          /> */}

          {/* Debug Panel - Remove after fixing the issue */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info (Development Only)</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div data-testid="request-id">Request ID: {requestId}</div>
                <div>Loading: {loading.toString()}</div>
                <div>Error: {error || 'None'}</div>
                <div>Has Data: {!!vacationRequest}</div>
                <div>User Name: {vacationRequest?.userName || 'N/A'}</div>
                <div>Company: {vacationRequest?.company || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={() => router.push('/admin/vacation-requests')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              ← Back to All Requests
            </button>
          </div>

          {/* Request Details */}
          <div className="p-8 bg-white rounded-lg shadow-sm border">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-gray-200 pb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {vacationRequest.userName}
                  </h1>
                  <p className="text-gray-600 mt-1">{vacationRequest.userEmail}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    vacationRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                    vacationRequest.status === 'approved' ? 'bg-green-100 text-green-800 border-green-200' :
                    vacationRequest.status === 'denied' ? 'bg-red-100 text-red-800 border-red-200' :
                    'bg-gray-100 text-gray-800 border-gray-200'
                  }`}>
                    {vacationRequest.status}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    Requested {new Date(vacationRequest.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Dates and Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dates</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Start Date:</span>
                      <span className="font-medium">{new Date(vacationRequest.startDate).toLocaleDateString('en-GB', { timeZone: 'Europe/Paris' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{new Date(vacationRequest.endDate).toLocaleDateString('en-GB', { timeZone: 'Europe/Paris' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">
                        {vacationRequest.durationDays} day{vacationRequest.durationDays === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Company:</span>
                      <span className="font-medium">{vacationRequest.company}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{vacationRequest.type}</span>
                    </div>
                    {vacationRequest.isHalfDay && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Half Day:</span>
                        <span className="font-medium capitalize">{vacationRequest.halfDayType}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reason */}
              {vacationRequest.reason && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Reason</h3>
                  <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                    {vacationRequest.reason}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {vacationRequest.status === 'pending' && (
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap gap-4 mb-4">
                    <button 
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={actionLoading || isPending}
                      className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      data-testid="approve-button"
                    >
                      {(actionLoading || isPending) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      Approve Request
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('denied')}
                      disabled={actionLoading || isPending}
                      className="px-6 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      data-testid="deny-button"
                    >
                      {(actionLoading || isPending) && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                      )}
                      Reject Request
                    </button>
                  </div>
                  
                  {/* Date Update Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Update Dates</h4>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                        <input
                          type="date"
                          defaultValue={vacationRequest.startDate}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          id="startDate"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                        <input
                          type="date"
                          defaultValue={vacationRequest.endDate}
                          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          id="endDate"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const startDateInput = document.getElementById('startDate') as HTMLInputElement;
                          const endDateInput = document.getElementById('endDate') as HTMLInputElement;
                          if (startDateInput && endDateInput) {
                            handleDateUpdate(startDateInput.value, endDateInput.value);
                          }
                        }}
                        disabled={actionLoading || isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {(actionLoading || isPending) && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        Update Dates
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Change Info */}
              {vacationRequest.status !== 'pending' && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium capitalize">{vacationRequest.status}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This request has been {vacationRequest.status === 'approved' ? 'approved' : 'denied'}.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Team Calendar with Conflict Highlighting */}
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Team Calendar</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Selected vs. Conflicts - {conflicts.length} conflict{conflicts.length === 1 ? '' : 's'} found
                </p>
              </div>
              {conflictsLoading && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  <span>Checking conflicts...</span>
                </div>
              )}
            </div>

            <UnifiedVacationCalendar
              vacationRequests={allVacationRequests}
              currentRequestId={vacationRequest.id}
              readOnly={true}
              initialRange={{
                start: new Date(vacationRequest.startDate),
                end: new Date(vacationRequest.endDate)
              }}
              conflicts={conflicts}
              highlightRange={true}
              showLegend={true}
              compact={false}
              className="w-full"
              data-testid="request-calendar"
            />
          </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className={`p-4 rounded-lg shadow-lg border ${
            toastMessage.includes('successfully') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                toastMessage.includes('successfully') ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 