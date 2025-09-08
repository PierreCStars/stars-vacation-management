'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { CalendarConflict } from '@/lib/google/calendar-client';

interface CalendarConflictsPanelProps {
  requestId: string;
  startDate: string;
  endDate: string;
  requesterUserId: string;
}

export default function CalendarConflictsPanel({ 
  requestId, 
  startDate, 
  endDate, 
  requesterUserId 
}: CalendarConflictsPanelProps) {
  const { data: session } = useSession();
  const [conflicts, setConflicts] = useState<CalendarConflict[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>(['primary']);

  // Check if user has calendar access
  const hasCalendarAccess = session?.user?.hasCalendarAccess || false;

  const checkConflicts = async () => {
    if (!hasCalendarAccess) {
      setError('You need to connect your Google Calendar to check for conflicts.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/calendar/freebusy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterUserId,
          start: startDate,
          end: endDate,
          calendarIds: selectedCalendars
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check calendar conflicts');
      }

      const data = await response.json();
      setConflicts(data.conflicts || []);
      setHasChecked(true);
    } catch (err) {
      console.error('Error checking calendar conflicts:', err);
      setError(err instanceof Error ? err.message : 'Failed to check calendar conflicts');
    } finally {
      setLoading(false);
    }
  };

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case 'outOfOffice': return '🏖️';
      case 'allDay': return '📅';
      case 'busy': return '⏰';
      case 'event': return '📋';
      default: return '📌';
    }
  };

  const getConflictTypeLabel = (type: string) => {
    switch (type) {
      case 'outOfOffice': return 'Out of Office';
      case 'allDay': return 'All Day Event';
      case 'busy': return 'Busy';
      case 'event': return 'Event';
      default: return 'Unknown';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    if (dateString.includes('T')) {
      // Has time component
      return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Monaco'
      });
    } else {
      // All-day event
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'Europe/Monaco'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📅 Google Calendar Conflicts
        </h3>
        <div className="flex items-center space-x-2">
          {hasCalendarAccess ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✅ Connected
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              ⚠️ Not Connected
            </span>
          )}
        </div>
      </div>

      {!hasCalendarAccess && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Google Calendar Not Connected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  To check for calendar conflicts, you need to connect your Google Calendar. 
                  Please sign out and sign back in to grant calendar access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasCalendarAccess && (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calendars to Check
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes('primary')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCalendars([...selectedCalendars, 'primary']);
                    } else {
                      setSelectedCalendars(selectedCalendars.filter(id => id !== 'primary'));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Primary Calendar</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedCalendars.includes(process.env.NEXT_PUBLIC_TEAM_CALENDAR_ID || 'team@stars.mc')}
                  onChange={(e) => {
                    const teamCalendarId = process.env.NEXT_PUBLIC_TEAM_CALENDAR_ID || 'team@stars.mc';
                    if (e.target.checked) {
                      setSelectedCalendars([...selectedCalendars, teamCalendarId]);
                    } else {
                      setSelectedCalendars(selectedCalendars.filter(id => id !== teamCalendarId));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Team Calendar</span>
              </label>
            </div>
          </div>

          <button
            onClick={checkConflicts}
            disabled={loading || selectedCalendars.length === 0}
            className="w-full mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? '🔍 Checking...' : '🔍 Check for Calendar Conflicts'}
          </button>
        </>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error Checking Conflicts
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {hasChecked && (
        <div className="mt-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl mb-2">✅</div>
              <h4 className="text-lg font-medium text-green-800 mb-2">No Calendar Conflicts Found</h4>
              <p className="text-green-600">
                The requested vacation period appears to be free from calendar conflicts.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-3">
                🚨 Found {conflicts.length} Calendar Conflict{conflicts.length !== 1 ? 's' : ''}
              </h4>
              <div className="space-y-3">
                {conflicts.map((conflict, index) => (
                  <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-lg">{getConflictTypeIcon(conflict.type)}</span>
                          <span className="font-medium text-red-800">{conflict.summary}</span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {getConflictTypeLabel(conflict.type)}
                          </span>
                        </div>
                        <div className="text-sm text-red-700 space-y-1">
                          <p><strong>Start:</strong> {formatDateTime(conflict.start)}</p>
                          <p><strong>End:</strong> {formatDateTime(conflict.end)}</p>
                          {conflict.description && (
                            <p><strong>Description:</strong> {conflict.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Note:</strong> This feature checks for conflicts in the selected Google Calendars. 
          Make sure the calendars are properly shared and accessible.
        </p>
      </div>
    </div>
  );
}
