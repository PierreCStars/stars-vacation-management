'use client';

import { VacationRequest } from '@/types/vacation';

interface Conflict {
  request1: VacationRequest;
  request2: VacationRequest;
  overlap: string;
}

interface ConflictSummaryProps {
  conflicts: Conflict[];
  vacationRequests: VacationRequest[];
}

export default function ConflictSummary({ conflicts, vacationRequests }: ConflictSummaryProps) {
  // Calculate statistics
  const totalRequests = vacationRequests.length;
  const pendingRequests = vacationRequests.filter(req => req.status === 'pending').length;
  const approvedRequests = vacationRequests.filter(req => req.status === 'approved').length;
  const deniedRequests = vacationRequests.filter(req => req.status === 'denied').length;

  // Find high-conflict periods
  const getConflictPeriods = () => {
    const dateConflicts: { [key: string]: number } = {};
    
    conflicts.forEach(conflict => {
      const start1 = new Date(conflict.request1.startDate);
      const end1 = new Date(conflict.request1.endDate);
      const start2 = new Date(conflict.request2.startDate);
      const end2 = new Date(conflict.request2.endDate);
      
      // Find overlapping dates
      const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
      const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));
      
      for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        dateConflicts[dateKey] = (dateConflicts[dateKey] || 0) + 1;
      }
    });
    
    return Object.entries(dateConflicts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5 conflict days
  };

  const highConflictPeriods = getConflictPeriods();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{totalRequests}</div>
          <div className="text-sm text-blue-600">Total Requests</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600">{pendingRequests}</div>
          <div className="text-sm text-yellow-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600">{approvedRequests}</div>
          <div className="text-sm text-green-600">Approved</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="text-2xl font-bold text-red-600">{deniedRequests}</div>
          <div className="text-sm text-red-600">Denied</div>
        </div>
      </div>

      {/* Conflict Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Conflict Overview
        </h3>
        
        {conflicts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-2xl">✅</span>
            </div>
            <p className="text-green-600 font-medium">No conflicts detected</p>
            <p className="text-sm text-gray-500 mt-2">All vacation requests are properly scheduled</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-orange-600 text-lg mr-2">⚠️</span>
                <span className="font-semibold text-orange-800">
                  {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
                </span>
              </div>
              <p className="text-sm text-orange-700">
                These conflicts may require manual review and resolution
              </p>
            </div>

            {/* High Conflict Periods */}
            {highConflictPeriods.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">High Conflict Periods</h4>
                <div className="space-y-2">
                  {highConflictPeriods.map(([date, count]) => (
                    <div key={date} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                      <span className="text-sm text-gray-700">
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                        {count} conflict{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detailed Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Conflicts ({conflicts.length})
          </h3>
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-orange-800">Conflict #{index + 1}</h4>
                    <p className="text-sm text-orange-700">
                      {conflict.request1.userName} vs {conflict.request2.userName}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                    CONFLICT
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <p className="font-medium text-orange-700 text-sm mb-2">{conflict.request1.userName}</p>
                    <div className="text-xs text-orange-600 space-y-1">
                      <div>
                        <span className="font-medium">Start:</span> {new Date(conflict.request1.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {new Date(conflict.request1.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          conflict.request1.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          conflict.request1.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {conflict.request1.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 rounded border border-orange-200">
                    <p className="font-medium text-orange-700 text-sm mb-2">{conflict.request2.userName}</p>
                    <div className="text-xs text-orange-600 space-y-1">
                      <div>
                        <span className="font-medium">Start:</span> {new Date(conflict.request2.startDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {new Date(conflict.request2.endDate).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded text-xs ${
                          conflict.request2.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          conflict.request2.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {conflict.request2.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-orange-200">
                  <p className="text-xs text-orange-600">
                    <span className="font-medium">Overlap:</span> {new Date(conflict.overlap.split(' to ')[0]).toLocaleDateString()} - {new Date(conflict.overlap.split(' to ')[1]).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
