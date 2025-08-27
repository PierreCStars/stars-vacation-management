'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import VacationCalendar from '@/components/VacationCalendar';
import { VacationRequest } from '@/types/vacation';

export default function AdminVacationRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }

    // Check if user has admin access
    const isAdmin = session.user.email === 'johnny@stars.mc' || 
                    session.user.email === 'daniel@stars.mc' || 
                    session.user.email === 'pierre@stars.mc' || 
                    session.user.email === 'compta@stars.mc';

    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    fetchVacationRequests();
  }, [session, status, router]);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        setVacationRequests(data);
      } else {
        setError('Failed to fetch vacation requests');
      }
    } catch (error) {
      setError('Error fetching vacation requests');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading vacation requests...</p>
          </div>
        </main>
      </>
    );
  }

  if (_error) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-red-600">{_error}</p>
          </div>
        </main>
      </>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Check if user has admin access
  const isAdmin = session.user.email === 'johnny@stars.mc' || 
                  session.user.email === 'daniel@stars.mc' || 
                  session.user.email === 'pierre@stars.mc' || 
                  session.user.email === 'compta@stars.mc';

  if (!isAdmin) {
    return null;
  }

  const pendingRequests = vacationRequests.filter(req => req.status === 'PENDING');
  const approvedRequests = vacationRequests.filter(req => req.status === 'APPROVED');
  const rejectedRequests = vacationRequests.filter(req => req.status === 'REJECTED');

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <PageHeader 
            title="Vacation Requests Management"
          />

          {/* Calendar Preview */}
          <div className="mb-12">
            <VacationCalendar 
              vacationRequests={vacationRequests}
              className="w-full"
            />
          </div>

          {/* Requests Management */}
          <div className="space-y-8">
            {/* Pending Requests */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Pending Requests</h2>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <Card className="text-center py-8">
                    <p className="text-gray-500">No pending vacation requests</p>
                  </Card>
                ) : (
                  pendingRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {request.userName}
                            </h3>
                            <Badge status={request.status} />
                          </div>
                          <div className="text-gray-600 mb-2">{request.userEmail || request.userId}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Start:</span> 
                              <span className="ml-2">{new Date(request.startDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">End:</span> 
                              <span className="ml-2">{new Date(request.endDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Company:</span> 
                              <span className="ml-2">{request.company}</span>
                            </div>
                          </div>
                          {/* ½-Day Information */}
                          {(request.isHalfDay || request.durationDays !== undefined) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 text-sm">
                                {request.isHalfDay && request.halfDayType && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Half Day ({request.halfDayType === 'morning' ? 'Morning' : 'Afternoon'})
                                  </span>
                                )}
                                {request.durationDays !== undefined && (
                                  <span className="text-gray-600">
                                    Duration: <strong>{request.durationDays} day{request.durationDays === 1 ? '' : 's'}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {request.reason && (
                            <div className="mt-3">
                              <span className="font-medium text-gray-700">Reason:</span>
                              <p className="text-gray-600 mt-1">{request.reason}</p>
                            </div>
                          )}
                          <div className="mt-4">
                            <a 
                              href={`/admin/vacation-requests/${request.id}`}
                              className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
                            >
                              Review Request →
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Approved Requests */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Approved Requests</h2>
              <div className="space-y-4">
                {approvedRequests.length === 0 ? (
                  <Card className="text-center py-8">
                    <p className="text-gray-500">No approved vacation requests</p>
                  </Card>
                ) : (
                  approvedRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {request.userName}
                            </h3>
                            <Badge status={request.status} />
                          </div>
                          <div className="text-gray-600 mb-2">{request.userEmail || request.userId}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Start:</span> 
                              <span className="ml-2">{new Date(request.startDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">End:</span> 
                              <span className="ml-2">{new Date(request.endDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Company:</span> 
                              <span className="ml-2">{request.company}</span>
                            </div>
                          </div>
                          {/* ½-Day Information */}
                          {(request.isHalfDay || request.durationDays !== undefined) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 text-sm">
                                {request.isHalfDay && request.halfDayType && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Half Day ({request.halfDayType === 'morning' ? 'Morning' : 'Afternoon'})
                                  </span>
                                )}
                                {request.durationDays !== undefined && (
                                  <span className="text-gray-600">
                                    Duration: <strong>{request.durationDays} day{request.durationDays === 1 ? '' : 's'}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mt-4">
                            <a 
                              href={`/admin/vacation-requests/${request.id}`}
                              className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
                            >
                              View Details →
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Rejected Requests */}
            {rejectedRequests.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Rejected Requests</h2>
                <div className="space-y-4">
                  {rejectedRequests.map((request) => (
                    <Card key={request.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {request.userName}
                            </h3>
                            <Badge status={request.status} />
                          </div>
                          <div className="text-gray-600 mb-2">{request.userEmail || request.userId}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Start:</span> 
                              <span className="ml-2">{new Date(request.startDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">End:</span> 
                              <span className="ml-2">{new Date(request.endDate).toLocaleDateString()}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Company:</span> 
                              <span className="ml-2">{request.company}</span>
                            </div>
                          </div>
                          {/* ½-Day Information */}
                          {(request.isHalfDay || request.durationDays !== undefined) && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 text-sm">
                                {request.isHalfDay && request.halfDayType && (
                                  <span className="inline-flex items-center px-2.3 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    Half Day ({request.halfDayType === 'morning' ? 'Morning' : 'Afternoon'})
                                  </span>
                                )}
                                {request.durationDays !== undefined && (
                                  <span className="text-gray-600">
                                    Duration: <strong>{request.durationDays} day{request.durationDays === 1 ? '' : 's'}</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          <div className="mt-4">
                            <a 
                              href={`/admin/vacation-requests/${request.id}`}
                              className="inline-flex items-center text-gray-600 hover:text-gray-700 font-medium"
                            >
                              View Details →
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 
