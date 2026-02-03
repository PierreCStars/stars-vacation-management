'use client';

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/config/admins';
import { VacationRequest } from '@/types/vacation';
import { getCompanyHexColor } from '@/lib/company-colors';

interface VacationConflictCalendarProps {
  vacationRequests: VacationRequest[];
  currentRequestId?: string; // To highlight the current request being reviewed
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  vacations: VacationRequest[];
  conflictCount: number;
  hasConflict: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
}

export default function VacationConflictCalendar({ 
  vacationRequests, 
  currentRequestId 
}: VacationConflictCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get session to check admin status
  const { data: session } = useSession();
  const isAdminUser = isAdmin(session?.user?.email);

  // Get current month info
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // Generate calendar days
  const calendarDays = useMemo(() => {
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

      // Calculate conflicts
      const conflictCount = dayVacations.length;
      const hasConflict = conflictCount > 1;
      
      // Determine severity
      let severity: 'none' | 'low' | 'medium' | 'high';
      if (conflictCount === 0) severity = 'none';
      else if (conflictCount === 1) severity = 'low';
      else if (conflictCount === 2) severity = 'medium';
      else severity = 'high';



      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === currentMonth,
        isToday: date.toDateString() === currentDateObj.toDateString(),
        vacations: dayVacations,
        conflictCount,
        hasConflict,
        severity
      });
    }

    return days;
  }, [vacationRequests, currentMonth, startDate]);

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

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500';
      case 'REJECTED': return 'bg-red-500';
      case 'PENDING': return 'bg-amber-500';
      default: return 'bg-slate-500';
    }
  };

  // Get conflict severity styling
  const getConflictStyling = (severity: string) => {
    switch (severity) {
      case 'none': return { bg: 'bg-white', border: 'border-slate-200', ring: '' };
      case 'low': return { bg: 'bg-blue-50', border: 'border-blue-200', ring: 'ring-2 ring-blue-300' };
      case 'medium': return { bg: 'bg-orange-50', border: 'border-orange-200', ring: 'ring-2 ring-orange-400' };
      case 'high': return { bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-2 ring-red-500' };
      default: return { bg: 'bg-white', border: 'border-slate-200', ring: '' };
    }
  };

  // Get severity icon and color
  const getSeverityIndicator = (severity: string) => {
    switch (severity) {
      case 'low': return { icon: '💡', color: 'text-blue-600', bg: 'bg-blue-100' };
      case 'medium': return { icon: '⚠️', color: 'text-orange-600', bg: 'bg-orange-100' };
      case 'high': return { icon: '🚨', color: 'text-red-600', bg: 'bg-red-100' };
      default: return { icon: '', color: '', bg: '' };
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="card overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 -m-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              🗓️ Vacation Conflict Calendar
            </h2>
            <p className="text-blue-100">
              Monitor team availability and detect scheduling conflicts
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all duration-200 font-semibold"
            >
              Today
            </button>
            
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center py-6 bg-white border-b border-slate-200">
        <h3 className="text-2xl font-bold text-slate-800">
          {monthNames[currentMonth]} {currentYear}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="mb-6">
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center">
              <div className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                {day}
              </div>
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const conflictStyle = getConflictStyling(day.severity);
            const severityIndicator = getSeverityIndicator(day.severity);
            
            return (
              <div
                key={index}
                className={`
                  min-h-[90px] p-2 border transition-all duration-200 cursor-pointer relative
                  ${conflictStyle.bg} ${conflictStyle.border} ${conflictStyle.ring}
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${day.isToday ? '' : 'border-gray-200'}
                  hover:shadow-md hover:bg-gray-50
                `}
                style={day.isToday ? { border: '3px solid #d8B11B' } : {}}
                onClick={() => setSelectedDate(day.date)}
              >
                {/* Day number */}
                <div className={`
                  text-sm font-bold mb-1 text-center
                  ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                `}
                style={day.isToday ? { color: '#d8B11B' } : {}}
                >
                  {day.dayNumber}
                </div>

                {/* Conflict indicator */}
                {day.hasConflict && (
                  <div className="absolute top-1 right-1">
                    <div className={`${severityIndicator.bg} ${severityIndicator.color} text-xs px-1.5 py-0.5 rounded-full font-bold`}>
                      {severityIndicator.icon} {day.conflictCount}
                    </div>
                  </div>
                )}

                {/* Vacation indicators */}
                <div className="space-y-1">
                  {day.vacations.slice(0, 2).map((vacation) => (
                    <div
                      key={vacation.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${vacation.id === currentRequestId ? 'ring-2 ring-blue-400' : ''}
                        ${getStatusColor(vacation.status)}
                        text-white font-medium
                      `}
                      title={`${vacation.userName} - ${vacation.status}`}
                    >
                      {vacation.userName}
                    </div>
                  ))}
                  
                  {/* Show more indicator if there are more than 2 vacations */}
                  {day.vacations.length > 2 && (
                    <div className="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded text-center">
                      +{day.vacations.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-4 border-t border-gray-200 -mx-6 -mb-6">
        <h4 className="font-semibold text-gray-700 mb-3">📊 Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-gray-600">Approved</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-amber-500 rounded"></div>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Rejected</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-100 text-blue-600 text-xs rounded-full flex items-center justify-center font-bold">💡</div>
            <span className="text-gray-600">Low Conflict</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 text-red-600 text-xs rounded-full flex items-center justify-center font-bold">🚨</div>
            <span className="text-gray-600">High Conflict</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="bg-blue-50 p-4 border-t border-blue-200 -mx-6 -mb-6">
          <h4 className="font-bold text-blue-800 mb-3">
            📅 {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h4>
          
          {calendarDays.find(d => d.date.toDateString() === selectedDate.toDateString())?.vacations.length === 0 ? (
            <div className="text-center py-3">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-blue-600 font-medium">No vacation requests on this date</p>
              <p className="text-blue-500 text-sm">Team is fully available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calendarDays
                .find(d => d.date.toDateString() === selectedDate.toDateString())
                ?.vacations.map(vacation => (
                  <div key={vacation.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-800">{vacation.userName}</span>
                        <span 
                          className="text-sm px-2 py-1 rounded text-white font-medium"
                           style={{ backgroundColor: getCompanyHexColor(vacation.company || 'UNKNOWN') }}
                        >
                          {vacation.company || 'Unknown'}
                        </span>
                        <span className="text-xs text-gray-400">{vacation.type}</span>
                      </div>
                      {isAdminUser && vacation.reason && (
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
    </div>
  );
}
