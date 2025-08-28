'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { VacationRequest } from '@/types/vacation';
import { getCompanyHexColor } from '@/lib/company-colors';

interface CompanyEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
}

interface UnifiedVacationCalendarProps {
  vacationRequests: VacationRequest[];
  currentRequestId?: string;
  showLegend?: boolean;
  compact?: boolean;
  className?: string;
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
}

export default function UnifiedVacationCalendar({ 
  vacationRequests, 
  currentRequestId,
  showLegend = true,
  compact = false,
  className = ''
}: UnifiedVacationCalendarProps) {
  console.log('UnifiedVacationCalendar: Component starting to render');
  console.log('UnifiedVacationCalendar: Props received:', { vacationRequests: vacationRequests?.length, currentRequestId, showLegend, compact, className });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Fetch company events from the source calendar
  useEffect(() => {
    console.log('UnifiedVacationCalendar: useEffect running');
    const fetchCompanyEvents = async () => {
      try {
        console.log('UnifiedVacationCalendar: Starting to fetch company events...');
        setLoadingEvents(true);
        const response = await fetch('/api/calendar/source?days=90');
        console.log('UnifiedVacationCalendar: API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('UnifiedVacationCalendar: Company events received:', data);
          setCompanyEvents(data.events || []);
        } else {
          console.error('UnifiedVacationCalendar: Failed to fetch company events:', response.status);
          setCompanyEvents([]);
        }
      } catch (error) {
        console.error('UnifiedVacationCalendar: Error fetching company events:', error);
        setCompanyEvents([]);
      } finally {
        console.log('UnifiedVacationCalendar: Setting loadingEvents to false');
        setLoadingEvents(false);
      }
    };

    fetchCompanyEvents();
  }, []);

  // Get current month info
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    console.log('UnifiedVacationCalendar: Generating calendar days');
    const days: CalendarDay[] = [];
    const currentDateObj = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
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

      // Calculate conflicts (including company events)
      const totalEvents = dayVacations.length + dayCompanyEvents.length;
      const hasConflict = totalEvents > 1;
      
      // Determine severity
      let severity: 'none' | 'low' | 'medium' | 'high';
      if (totalEvents === 0) severity = 'none';
      else if (totalEvents === 1) severity = 'low';
      else if (totalEvents === 2) severity = 'medium';
      else severity = 'high';

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === currentDateObj.toDateString(),
        vacations: dayVacations,
        companyEvents: dayCompanyEvents,
        conflictCount: totalEvents,
        hasConflict,
        severity
      });
    }

    console.log('UnifiedVacationCalendar: Generated', days.length, 'calendar days');
    return days;
  }, [vacationRequests, companyEvents, currentMonth, startDate]);

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
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

  console.log('UnifiedVacationCalendar: About to render JSX');

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className} ${compact ? 'mini-calendar' : ''}`}>
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-bold ${compact ? 'text-lg' : 'text-xl'}`}>
              🗓️ Vacation & Company Calendar
            </h2>
            <p className="text-blue-100 text-sm">
              {compact ? 'Team availability & company events' : 'Monitor team availability, company events, and detect scheduling conflicts'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
              title="Previous month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="px-3 py-1 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold text-sm"
            >
              Today
            </button>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
              title="Next month"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center py-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </h3>
      </div>

      {/* Debug Info */}
      <div className="p-4 bg-yellow-50 border-b border-yellow-200">
        <p className="text-sm text-yellow-800">
          Debug: Vacation Requests: {vacationRequests?.length || 0}, Company Events: {companyEvents.length}, Loading: {loadingEvents ? 'Yes' : 'No'}
        </p>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`p-2 min-h-[80px] border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
              } ${getConflictColor(day.severity)} ${
                day.isToday ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
              onClick={() => setSelectedDate(selectedDate?.toDateString() === day.date.toDateString() ? null : day.date)}
            >
              <div className={`text-sm font-medium ${
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
                ?.vacations.length === 0 ? (
              <p className="text-gray-500 text-sm">No events or vacation requests on this date</p>
            ) : (
              <div className="space-y-3">
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

        {/* Simple Legend */}
        {showLegend && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                <span className="text-sm text-gray-600">Company Events</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-600">Vacation Requests</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
