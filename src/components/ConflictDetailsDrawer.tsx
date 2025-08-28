'use client';

import React from 'react';

interface ConflictDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: Array<{
    type: 'same-company' | 'calendar-event';
    severity: 'low' | 'medium' | 'high';
    details: string;
    conflictingRequests?: Array<{
      id: string;
      userName: string;
      company: string;
      startDate: string;
      endDate: string;
      status: string;
    }>;
    calendarEvents?: Array<{
      id: string;
      title: string;
      startDate: string;
      endDate: string;
      location: string;
    }>;
  }>;
  requestId: string;
}

export default function ConflictDetailsDrawer({ 
  isOpen, 
  onClose, 
  conflicts, 
  requestId 
}: ConflictDetailsDrawerProps) {
  if (!isOpen) return null;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return 'ℹ️';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'same-company': return '🏢';
      case 'calendar-event': return '📅';
      default: return '❓';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">
              🚨 Conflict Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {conflicts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Conflicts Found</h3>
                <p className="text-gray-600">This vacation request doesn't conflict with any existing schedules.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Request ID: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{requestId}</span>
                </div>

                {conflicts.map((conflict, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    {/* Conflict Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getTypeIcon(conflict.type)}</span>
                        <span className="text-lg font-medium text-gray-900">
                          {conflict.type === 'same-company' ? 'Company Overlap' : 'Calendar Conflict'}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(conflict.severity)}`}>
                        <span className="mr-1">{getSeverityIcon(conflict.severity)}</span>
                        {conflict.severity}
                      </span>
                    </div>

                    {/* Conflict Details */}
                    <p className="text-gray-700 mb-4">{conflict.details}</p>

                    {/* Conflicting Requests */}
                    {conflict.conflictingRequests && conflict.conflictingRequests.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Conflicting Vacation Requests:</h4>
                        <div className="space-y-2">
                          {conflict.conflictingRequests.map((req, reqIndex) => (
                            <div key={reqIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">{req.userName}</span>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {req.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>Company: {req.company}</div>
                                <div>Dates: {req.startDate} to {req.endDate}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Calendar Events */}
                    {conflict.calendarEvents && conflict.calendarEvents.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Conflicting Company Events:</h4>
                        <div className="space-y-2">
                          {conflict.calendarEvents.map((event, eventIndex) => (
                            <div key={eventIndex} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <div className="font-medium text-blue-900 mb-1">{event.title}</div>
                              <div className="text-sm text-blue-700">
                                <div>Dates: {event.startDate} to {event.endDate}</div>
                                {event.location && <div>Location: {event.location}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
