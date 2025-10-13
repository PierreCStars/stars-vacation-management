'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { VacationRequest } from '@/types/vacation';
import { getCompanyHexColor } from '@/lib/company-colors';

interface CompanyEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
}

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

interface UnifiedVacationCalendarProps {
  vacationRequests: VacationRequest[];
  currentRequestId?: string;
  showLegend?: boolean;
  compact?: boolean;
  className?: string;
  // New props for conflict highlighting
  readOnly?: boolean;
  initialRange?: { start: Date; end: Date };
  conflicts?: ConflictEvent[];
  highlightRange?: boolean;
  onRangeChange?: (range: { start: Date; end: Date }) => void;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  vacations: VacationRequest[];
  companyEvents: CompanyEvent[];
  conflictCount: number;
  hasConflict: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  // New properties for conflict highlighting
  isInSelectedRange?: boolean;
  conflictEvents?: ConflictEvent[];
}

export default function UnifiedVacationCalendar({ 
  vacationRequests, 
  currentRequestId,
  showLegend = true,
  compact = false,
  className = '',
  // New props
  readOnly = false,
  initialRange,
  conflicts = [],
  highlightRange = false,
  onRangeChange
}: UnifiedVacationCalendarProps) {

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Use next-intl translations
  const tCalendar = useTranslations('calendar');

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch company events from the unified calendar API
  useEffect(() => {
    if (!mounted) return;
    
    const fetchCompanyEvents = async () => {
      try {
        setLoadingEvents(true);
        const response = await fetch('/api/calendar-events?includeVacationRequests=true', {
          next: { tags: ['calendar:all'] }
        });
        if (response.ok) {
          const data = await response.json();
          setCompanyEvents(data.events || []);
        } else {
          console.error('Failed to fetch company events:', response.status);
          setCompanyEvents([]);
        }
      } catch (error) {
        console.error('Error fetching company events:', error);
        setCompanyEvents([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchCompanyEvents();
  }, [mounted]); // Run only after component mounts

  // Get current month info - memoized to prevent recalculation
  const monthInfo = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
    
    return { currentMonth, currentYear, firstDayOfMonth, startDate };
  }, [currentDate]);

  // Generate calendar days - memoized to prevent regeneration on every render
  const calendarDays = useMemo(() => {
    if (!mounted) return [];
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(monthInfo.startDate);
      date.setDate(monthInfo.startDate.getDate() + i);
      
      // Find vacations for this date
      const dayVacations = vacationRequests.filter(request => {
        const start = new Date(request.startDate);
        const end = new Date(request.endDate);
        return date >= start && date <= end;
      });

      // Find company events for this date
      const dayCompanyEvents = companyEvents.filter(event => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        return date >= start && date <= end;
      });

      // Find conflict events for this date
      const dayConflictEvents = conflicts.filter(conflict => {
        const start = new Date(conflict.startDate);
        const end = new Date(conflict.endDate);
        return date >= start && date <= end;
      });

      // Check if date is in selected range
      const isInSelectedRange = initialRange && 
        date >= initialRange.start && 
        date <= initialRange.end;

      // Calculate conflicts (including company events and conflict events)
      const totalEvents = dayVacations.length + dayCompanyEvents.length + dayConflictEvents.length;
      const hasConflict = totalEvents > 1 || dayConflictEvents.length > 0;
      
      // Determine severity
      let severity: 'none' | 'low' | 'medium' | 'high';
      if (totalEvents === 0) severity = 'none';
      else if (totalEvents === 1) severity = 'low';
      else if (totalEvents === 2) severity = 'medium';
      else severity = 'high';

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === monthInfo.currentMonth,
        isToday: date.toDateString() === currentDateObj.toDateString(),
        vacations: dayVacations,
        companyEvents: dayCompanyEvents,
        conflictCount: totalEvents,
        hasConflict,
        severity,
        isInSelectedRange,
        conflictEvents: dayConflictEvents
      });
    }

    return days;
  }, [vacationRequests, companyEvents, monthInfo, conflicts, initialRange, mounted]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(monthInfo.currentYear, monthInfo.currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(monthInfo.currentYear, monthInfo.currentMonth + 1, 1));
  };

  const goToToday = () => {
    if (mounted) {
      setCurrentDate(new Date());
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-300';
      case 'medium': return 'bg-orange-100 border-orange-300';
      case 'low': return 'bg-blue-100 border-blue-300';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className} ${compact ? 'mini-calendar' : ''}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className} ${compact ? 'mini-calendar' : ''} overflow-hidden`}>
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 sm:p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold ${compact ? 'text-lg' : 'text-lg sm:text-xl'} truncate`}>
              🗓️ <span className="hidden sm:inline">{tCalendar('vacationCompanyCalendar')}</span>
              <span className="sm:hidden">{tCalendar('calendar')}</span>
              <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded" data-version="responsive-v1">📱</span>
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              {compact ? tCalendar('teamAvailabilityCompanyEvents') : tCalendar('monitorTeamAvailability')}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
              title={tCalendar('previousMonth')}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{tCalendar('today')}</span>
              <span className="sm:hidden">Now</span>
            </button>
            
            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
              title={tCalendar('nextMonth')}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center py-3 sm:py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
          {monthNames[monthInfo.currentMonth]} {monthInfo.currentYear}
        </h3>
      </div>

      {/* Debug Info */}
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800">
          Debug: Vacation Requests: {vacationRequests?.length || 0}, Company Events: {companyEvents.length}, Loading: {loadingEvents ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] border rounded-lg transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
              } ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${getConflictColor(day.severity)} ${
                day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              } ${
                day.isInSelectedRange ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : ''
              } ${
                day.conflictEvents && day.conflictEvents.length > 0 ? 'bg-red-50 border-red-300 ring-1 ring-red-200' : ''
              }`}
              onClick={() => !readOnly && setSelectedDate(selectedDate?.toDateString() === day.date.toDateString() ? null : day.date)}
            >
              <div className={`text-xs sm:text-sm font-medium ${
                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${day.isToday ? 'text-blue-600 font-bold' : ''}`}>
                {day.dayNumber}
              </div>
              
              {/* Company Events (displayed first with different styling) */}
              {day.companyEvents.length > 0 && (
                <div className="mt-1 space-y-1">
                  {day.companyEvents.slice(0, compact ? 1 : 2).map((event, eventIndex) => (
                    <div
                      key={`event-${eventIndex}`}
                      className="text-xs p-1 rounded truncate font-medium bg-purple-100 border border-purple-300 text-purple-800"
                      title={`${event.title}${event.location ? ` • ${event.location}` : ''}`}
                    >
                      {compact ? '📅' : `📅 ${event.title.substring(0, 8)}...`}
                    </div>
                  ))}
                  {day.companyEvents.length > (compact ? 1 : 2) && (
                    <div className="text-xs text-purple-600 font-medium">
                      +{day.companyEvents.length - (compact ? 1 : 2)} more events
                    </div>
                  )}
                </div>
              )}
              
              {/* Conflict events (displayed first with distinct styling) */}
              {day.conflictEvents && day.conflictEvents.length > 0 && (
                <div className="mt-1 space-y-1">
                  {day.conflictEvents.slice(0, compact ? 1 : 2).map((conflict, conflictIndex) => (
                    <div
                      key={`conflict-${conflictIndex}`}
                      className="text-xs p-1 rounded truncate font-medium bg-red-100 border border-red-300 text-red-800"
                      title={`CONFLICT: ${conflict.userName} - ${conflict.company} (${conflict.status})`}
                    >
                      {compact ? '⚠️' : `⚠️ ${conflict.userName.substring(0, 8)}...`}
                    </div>
                  ))}
                  {day.conflictEvents.length > (compact ? 1 : 2) && (
                    <div className="text-xs text-red-600 font-medium">
                      +{day.conflictEvents.length - (compact ? 1 : 2)} conflicts
                    </div>
                  )}
                </div>
              )}

              {/* Vacation indicators */}
              {day.vacations.length > 0 && (
                <div className="mt-1 space-y-1">
                  {day.vacations.slice(0, compact ? 1 : 2).map((vacation, reqIndex) => {
                    const companyColor = getCompanyHexColor(vacation.company);
                    const textColor = vacation.company === 'STARS_MC' || vacation.company === 'LE_PNEU' ? '#ffffff' : '#000000';
                    
                    return (
                      <div
                        key={reqIndex}
                        className="text-xs p-1 rounded truncate font-medium"
                        style={{
                          backgroundColor: companyColor,
                          color: textColor
                        }}
                        title={`${vacation.userName} - ${vacation.company} (${vacation.status})`}
                      >
                        {compact ? vacation.userName.substring(0, 3) : vacation.userName}
                      </div>
                    );
                  })}
                  {day.vacations.length > (compact ? 1 : 2) && (
                    <div className="text-xs text-gray-600 font-medium">
                      +{day.vacations.length - (compact ? 1 : 2)} more
                    </div>
                  )}
                </div>
              )}

              {/* Conflict indicator */}
              {day.hasConflict && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    day.severity === 'high' ? 'bg-red-100 text-red-800' :
                    day.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {day.conflictCount} conflicts
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h4>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {calendarDays
              .find(d => d.date.toDateString() === selectedDate.toDateString())
              ?.companyEvents.length === 0 && 
              calendarDays
                .find(d => d.date.toDateString() === selectedDate.toDateString())
                ?.vacations.length === 0 &&
              calendarDays
                .find(d => d.date.toDateString() === selectedDate.toDateString())
                ?.conflictEvents?.length === 0 ? (
              <p className="text-gray-500 text-sm">No events or vacation requests on this date</p>
            ) : (
              <div className="space-y-3">
                {/* Conflict Events */}
                {calendarDays
                  .find(d => d.date.toDateString() === selectedDate.toDateString())
                  ?.conflictEvents?.map(conflict => (
                    <div key={conflict.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-red-600">⚠️</span>
                          <span className="font-bold text-red-800">{conflict.userName}</span>
                          <span className="text-sm px-2 py-1 rounded bg-red-100 text-red-800 font-medium">
                            CONFLICT
                          </span>
                          <span className="text-xs text-gray-400">{conflict.type}</span>
                        </div>
                        <p className="text-sm text-red-600 mt-1">
                          {conflict.startDate === conflict.endDate ? 
                            conflict.startDate : 
                            `${conflict.startDate} - ${conflict.endDate}`
                          }
                        </p>
                        {conflict.reason && (
                          <p className="text-sm text-red-500 mt-1">{conflict.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(conflict.status)} text-white`}>
                          {conflict.status}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Company Events */}
                {calendarDays
                  .find(d => d.date.toDateString() === selectedDate.toDateString())
                  ?.companyEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-purple-600">📅</span>
                          <span className="font-bold text-purple-800">{event.title}</span>
                          <span className="text-sm px-2 py-1 rounded bg-purple-100 text-purple-800 font-medium">
                            Company Event
                          </span>
                        </div>
                        {event.location && (
                          <p className="text-sm text-purple-600 mt-1">📍 {event.location}</p>
                        )}
                        <p className="text-xs text-purple-500 mt-1">
                          {event.startDate === event.endDate ? 
                            event.startDate : 
                            `${event.startDate} - ${event.endDate}`
                          }
                        </p>
                      </div>
                    </div>
                  ))}

                {/* Vacation Requests */}
                {calendarDays
                  .find(d => d.date.toDateString() === selectedDate.toDateString())
                  ?.vacations.map(vacation => (
                    <div key={vacation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-gray-800">{vacation.userName}</span>
                          <span 
                            className="text-sm px-2 py-1 rounded text-white font-medium"
                            style={{ backgroundColor: getCompanyHexColor(vacation.company) }}
                          >
                            {vacation.company}
                          </span>
                          <span className="text-xs text-gray-400">{vacation.type}</span>
                        </div>
                        {vacation.reason && (
                          <p className="text-sm text-gray-600 mt-1">{vacation.reason}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColor(vacation.status)} text-white`}>
                          {vacation.status}
                        </span>
                        {vacation.id === currentRequestId && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                            Current Request
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Legend */}
        {showLegend && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {highlightRange && initialRange && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-50 border border-blue-300 rounded"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Selected Range</span>
                </div>
              )}
              {conflicts.length > 0 && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-xs sm:text-sm text-gray-600">Conflicts</span>
                </div>
              )}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-100 border border-purple-300 rounded"></div>
                <span className="text-xs sm:text-sm text-gray-600">Company Events</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded"></div>
                <span className="text-xs sm:text-sm text-gray-600">Vacation Requests</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
