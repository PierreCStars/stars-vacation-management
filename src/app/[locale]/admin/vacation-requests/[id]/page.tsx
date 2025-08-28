'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface VacationRequest {
  id: string;
  userName: string;
  userEmail: string;
  startDate: string;
  endDate: string;
  reason: string;
  company: string;
  type: string;
  status: string;
  isHalfDay: boolean;
  halfDayType: string | null;
  durationDays: number;
  createdAt: string;
}

export default function VacationRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [vacationRequest, setVacationRequest] = useState<VacationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = params.id as string;

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

  const handleStatusUpdate = async (newStatus: string) => {
    if (!vacationRequest) return;
    
    try {
      // For now, just update the local state
      // In production, this would update the database
      setVacationRequest({
        ...vacationRequest,
        status: newStatus
      });
      
      // Show success message
      alert(`Status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
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
      userName: 'John Smith (Mock)',
      userEmail: 'john@example.com',
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
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vacation request...</p>
              <p className="text-sm text-gray-500 mt-2">Request ID: {requestId}</p>
              <p className="text-sm text-gray-500">Loading state: {loading.toString()}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
        </div>
      </>
    );
  }

  if (!vacationRequest) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Simple Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Vacation Request Details</h1>
          </div>

          {/* Page Header */}
          <PageHeader 
            title="Vacation Request Details"
            description={`Reviewing request from ${vacationRequest.userName}`}
          />

          {/* Debug Panel - Remove after fixing the issue */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Info (Development Only)</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Request ID: {requestId}</div>
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
          <Card className="p-8">
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
                  <Badge status={vacationRequest.status} />
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
                      <span className="font-medium">{new Date(vacationRequest.startDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">End Date:</span>
                      <span className="font-medium">{new Date(vacationRequest.endDate).toLocaleDateString()}</span>
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
                <div className="flex gap-4 pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => handleStatusUpdate('approved')}
                    className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve Request
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('rejected')}
                    className="px-6 py-2 border border-red-300 text-red-700 rounded hover:bg-red-50"
                  >
                    Reject Request
                  </button>
                </div>
              )}

              {/* Status Change Info */}
              {vacationRequest.status !== 'pending' && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Status: <span className="font-medium capitalize">{vacationRequest.status}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    This request has been {vacationRequest.status === 'approved' ? 'approved' : 'rejected'}.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
} 