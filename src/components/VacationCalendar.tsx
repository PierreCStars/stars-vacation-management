'use client';

import { useState } from 'react';
import { VacationRequest } from '@/types/vacation';
import CompanyLegend from './ui/CompanyLegend';

interface VacationCalendarProps {
  vacationRequests: VacationRequest[];
  className?: string;
}

export default function VacationCalendar({ vacationRequests, className = '' }: VacationCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('month');



  // Get calendar days for current month
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateCopy = new Date(startDate);
    
    while (currentDateCopy <= lastDay || days.length < 42) {
      days.push(new Date(currentDateCopy));
      currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }
    
    return days;
  };

  // Get vacation requests for a specific date
  const getRequestsForDate = (date: Date) => {
    return vacationRequests.filter(request => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const checkDate = new Date(date);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.getDate();
  };

  // Check if date is current month
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Get month name
  const getMonthName = () => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const calendarDays = getCalendarDays();

  return (
    <div className={`rounded-2xl overflow-hidden shadow-card ${className}`}>
      {/* Calendar Banner */}
      <div className="bg-brand text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Stars Vacation Calendar</h2>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-white text-brand' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-white text-brand' 
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Month
            </button>
          </div>
          
          {/* Date Range */}
          <span className="text-sm opacity-90">{getMonthName()}</span>
          
          {/* Open Full Button */}
          <a 
            href="/admin/vacation-requests" 
            className="px-3 py-1.5 rounded-lg bg-white/90 text-brand hover:bg-white transition-colors font-medium text-sm"
          >
            Open Full
          </a>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="bg-white p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-xl font-semibold text-gray-900">{getMonthName()}</h3>
          
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-6">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => {
            const requests = getRequestsForDate(day);
            const hasRequests = requests.length > 0;
            
            return (
              <div
                key={index}
                className={`p-2 min-h-[80px] border border-gray-200 ${
                  isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'
                } ${hasRequests ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                <div className={`text-sm font-medium ${
                  isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {formatDate(day)}
                </div>
                
                {hasRequests && (
                  <div className="mt-1 space-y-1">
                    {requests.slice(0, 2).map((request, reqIndex) => (
                      <div
                        key={reqIndex}
                        className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                        title={`${request.userName} - ${request.company}`}
                      >
                        {request.userName}
                      </div>
                    ))}
                    {requests.length > 2 && (
                      <div className="text-xs text-blue-600 font-medium">
                        +{requests.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Company Legend */}
        <div className="pt-4 border-t border-gray-200">
          <CompanyLegend title="Company Legend" compact={true} />
        </div>
      </div>
    </div>
  );
}
