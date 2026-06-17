'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/config/admins';
import { VacationRequest } from '@/types/vacation';
import { VacationRequestWithConflicts, ConflictEvent } from '@/app/[locale]/admin/vacation-requests/_server/getRequestsWithConflicts';
import { getCompanyHexColor, normalizeCompanyCode, getAllCompanyColors } from '@/lib/company-colors';
import { getMonacoHolidaysInRange, MonacoHoliday } from '@/lib/monaco-holidays';
import { getStatusColor, detectConflictsForEmployee } from '@/lib/statusColor';
import { countCompanyConflicts } from '@/lib/conflict-utils';
import { parseISODate, parseLocalDate, getFirstDayOfCalendarGrid, isToday, isInMonth, formatISODate } from '@/lib/dates';

interface CompanyEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  /** 'holiday-fr' = férié français (calendrier Google FR), stylé en hachures bleues. */
  kind?: string;
}

// Hachures fériés — palette SLG muted (brique pour Monaco, bleu retenu pour la France).
const MC_HOLIDAY_STRIPES: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(162,59,45,0.32) 0 6px, rgba(162,59,45,0.10) 6px 12px)',
};
const FR_HOLIDAY_STRIPES: React.CSSProperties = {
  backgroundImage:
    'repeating-linear-gradient(135deg, rgba(62,95,138,0.32) 0 6px, rgba(62,95,138,0.10) 6px 12px)',
};


interface UnifiedVacationCalendarProps {
  vacationRequests: (VacationRequest | VacationRequestWithConflicts)[];
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
  /** Fires when the user clicks a day cell. Lets the parent (e.g. the
   *  request form) react — typically by pre-filling its start-date input. */
  onDayClick?: (date: Date) => void;
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  vacations: VacationRequest[];
  companyEvents: CompanyEvent[];
  frenchHolidays: CompanyEvent[];
  monacoHolidays: MonacoHoliday[];
  conflictCount: number;
  hasConflict: boolean;
  severity: 'none' | 'low' | 'medium' | 'high';
  // New properties for conflict highlighting
  isInSelectedRange?: boolean;
  conflictEvents?: Array<{
    id: string;
    userName: string;
    company: string;
    startDate: string;
    endDate: string;
    status: string;
    type: string;
    severity: string;
    details: string;
  }>;
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
  onRangeChange,
  onDayClick
}: UnifiedVacationCalendarProps) {

  // Open on the requested period's month when a range is provided (e.g. the
  // email "Review Request" link), so the highlighted days are immediately visible.
  const [currentDate, setCurrentDate] = useState<Date>(
    () => (initialRange?.start ? new Date(initialRange.start) : new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [companyEvents, setCompanyEvents] = useState<CompanyEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Get session to check admin status
  const { data: session } = useSession();
  const isAdminUser = isAdmin(session?.user?.email);

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
    
    // Use date utility to get first day of calendar grid (Monday start)
    const startDate = getFirstDayOfCalendarGrid(currentYear, currentMonth, 1);
    
    return { currentMonth, currentYear, firstDayOfMonth, startDate };
  }, [currentDate]);

  // Generate calendar days - memoized to prevent regeneration on every render
  const calendarDays = useMemo(() => {
    if (!mounted) return [];
    
    // Debug logging when enabled
    if (process.env.NEXT_PUBLIC_DEBUG_CALENDAR === '1') {
      console.log('[CALENDAR DEBUG] vacationRequests count:', vacationRequests.length);
      console.log('[CALENDAR DEBUG] Month:', monthInfo.currentYear, monthInfo.currentMonth);
      console.log('[CALENDAR DEBUG] Sample requests:', vacationRequests.slice(0, 3));
    }
    
    const days: CalendarDay[] = [];
    const currentDateObj = new Date();
    let totalVacationsRendered = 0;

    for (let i = 0; i < 42; i++) {
      const date = new Date(monthInfo.startDate);
      date.setDate(monthInfo.startDate.getDate() + i);
      
      // Check if this is a weekend (Saturday = 6, Sunday = 0)
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Find vacations for this date (exclude rejected and cancelled)
      // Note: Vacation requests use inclusive end dates (stored in Firestore)
      const dayVacations = vacationRequests.filter(request => {
        const status = (request.status || '').toLowerCase();
        if (status === 'rejected' || status === 'denied' || status === 'cancelled' || status === 'canceled') return false;
        
        try {
          // Use safe local date parsing to prevent timezone issues
          const start = parseLocalDate(request.startDate);
          const end = parseLocalDate(request.endDate);
          
          // Vacation requests use inclusive end dates (both start and end are inclusive)
          return date >= start && date <= end;
        } catch (error) {
          console.error('Error parsing dates:', error, request);
          return false;
        }
      });
      
      totalVacationsRendered += dayVacations.length;

      // Find Monaco holidays for this date
      const dayMonacoHolidays = getMonacoHolidaysInRange(date, date);

      // Find company events for this date
      // Note: Company events from Google Calendar are normalized to use inclusive end dates
      const isOnDate = (event: CompanyEvent) => {
        try {
          const start = parseLocalDate(event.startDate);
          const end = parseLocalDate(event.endDate);
          // Events are normalized to inclusive end dates by the API
          return date >= start && date <= end;
        } catch (error) {
          return false;
        }
      };
      // Les fériés français (kind 'holiday-fr') sont séparés des événements
      // d'entreprise : style dédié (hachures bleues) et exclus du comptage de conflits.
      const dayCompanyEvents = companyEvents.filter(e => e.kind !== 'holiday-fr' && isOnDate(e));
      const dayFrenchHolidays = companyEvents.filter(e => e.kind === 'holiday-fr' && isOnDate(e));

      // Find conflict events for this date
      const dayConflictEvents = conflicts.filter(conflict => {
        // Check if any conflicting requests overlap with this date
        return conflict.conflictingRequests?.some(req => {
          try {
            const start = parseLocalDate(req.startDate);
            const end = parseLocalDate(req.endDate);
            return date >= start && date <= end;
          } catch (error) {
            return false;
          }
        }) || false;
      });

      // Flatten conflicting requests for easier access
      const flattenedConflicts = dayConflictEvents.flatMap(conflict => 
        conflict.conflictingRequests?.map(req => ({
          id: req.id,
          userName: req.userName,
          company: req.company,
          startDate: req.startDate,
          endDate: req.endDate,
          status: req.status,
          type: conflict.type,
          severity: conflict.severity,
          details: conflict.details
        })) || []
      );

      // Check if date is in selected range
      const isInSelectedRange = initialRange && 
        date >= initialRange.start && 
        date <= initialRange.end;

      // Conflit = au moins DEUX congés de la MÊME entreprise le même jour.
      // Les jours fériés et les événements d'entreprise ne sont PAS des conflits,
      // et deux personnes de sociétés différentes ne sont PAS en conflit.
      const conflictCount = countCompanyConflicts(dayVacations);
      const hasConflict = conflictCount > 0;

      // Sévérité selon le nombre de conflits simultanés
      const severity: 'none' | 'low' | 'medium' | 'high' =
        conflictCount === 0 ? 'none' : conflictCount === 1 ? 'medium' : 'high';

      days.push({
        date,
        dayNumber: date.getDate(),
        isCurrentMonth: isInMonth(date, monthInfo.currentYear, monthInfo.currentMonth),
        isToday: isToday(date),
        isWeekend,
        vacations: dayVacations,
        companyEvents: dayCompanyEvents,
        frenchHolidays: dayFrenchHolidays,
        monacoHolidays: dayMonacoHolidays,
        conflictCount,
        hasConflict,
        severity,
        isInSelectedRange,
        conflictEvents: flattenedConflicts
      });
    }

    // Debug logging when enabled
    if (process.env.NEXT_PUBLIC_DEBUG_CALENDAR === '1') {
      console.log('[CALENDAR DEBUG] Total vacations rendered:', totalVacationsRendered);
      console.log('[CALENDAR DEBUG] Days with vacations:', days.filter(d => d.vacations.length > 0).length);
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

  const getStatusColorClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-[#1F6E3A]';
      case 'rejected':
      case 'denied': return 'bg-[#C92B12]';
      case 'pending': return 'bg-[#F59B42]';
      default: return 'bg-gray-500';
    }
  };

  const getConflictColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-300';
      case 'medium': return 'bg-orange-100 border-orange-300';
      case 'low': return 'bg-gold/10 border-gold';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className} ${compact ? 'mini-calendar' : ''}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gold/30 border-t-gold mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className} ${compact ? 'mini-calendar' : ''} overflow-hidden`}>
      {/* Calendar Header */}
      <div className="bg-white text-ink p-3 sm:p-4 rounded-t-lg border-b border-gold/30">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className={`font-semibold text-ink ${compact ? 'text-lg' : 'text-lg sm:text-xl'} truncate`}>
              <span className="hidden sm:inline">{tCalendar('vacationCompanyCalendar')}</span>
              <span className="sm:hidden">{tCalendar('calendar')}</span>
            </h2>
            <p className="text-slate-ardoise/80 text-xs sm:text-sm mt-1">
              {compact ? tCalendar('teamAvailabilityCompanyEvents') : tCalendar('monitorTeamAvailability')}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-ink transition-colors"
              title={tCalendar('previousMonth')}
              aria-label={tCalendar('previousMonth')}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={goToToday}
              className="px-2 sm:px-3 py-1 bg-gold text-ink rounded-lg hover:bg-[#C49E15] transition-colors font-semibold text-xs sm:text-sm"
            >
              <span className="hidden sm:inline">{tCalendar('today')}</span>
              <span className="sm:hidden">Now</span>
            </button>

            <button
              onClick={goToNextMonth}
              className="p-1.5 sm:p-2 rounded-lg bg-cream-100 hover:bg-cream-200 text-ink transition-colors"
              title={tCalendar('nextMonth')}
              aria-label={tCalendar('nextMonth')}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Month/Year Display */}
      <div className="text-center py-3 sm:py-4 bg-white border-b border-black/5">
        <h3 className="text-lg sm:text-xl font-light text-ink tracking-tight">
          {monthNames[monthInfo.currentMonth]} {monthInfo.currentYear}
        </h3>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-4">
        {/* Day headers - Monday start */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="p-1 sm:p-2 text-center text-xs font-medium text-gray-500">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.charAt(0)}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            // Determine background color priority:
            // Conflict (vivid red) > Requested period (vivid orange) > Holiday/Event (grey)
            //   > Weekend (darker grey) > default
            const hasMonacoHoliday = day.monacoHolidays.length > 0;
            const hasFrenchHoliday = day.frenchHolidays.length > 0;
            const hasCompanyEvent = day.companyEvents.length > 0;
            const hasConflictEvent = day.conflictEvents && day.conflictEvents.length > 0;

            let bgColor = '';
            let bgColorStyle: React.CSSProperties = {};
            if (hasConflictEvent) {
              // Vivid red tint for conflicts — saturated but readable
              bgColorStyle = { backgroundColor: 'rgba(201, 43, 18, 0.15)' };
            } else if (day.isInSelectedRange) {
              // The requested period — vivid orange "pastille" so the reviewer
              // immediately sees the days being requested (and any overlap).
              bgColorStyle = {
                backgroundColor: 'rgba(249, 115, 22, 0.28)',
                boxShadow: 'inset 0 0 0 2px #F97316',
              };
            } else if (hasMonacoHoliday && hasFrenchHoliday) {
              // Férié commun MC + FR : hachures rouges + liseré bleu.
              bgColorStyle = {
                ...MC_HOLIDAY_STRIPES,
                boxShadow: 'inset 0 0 0 2px rgba(62,95,138,0.55)',
              };
            } else if (hasMonacoHoliday) {
              // Férié monégasque : hachures rouges (brique SLG)
              bgColorStyle = { ...MC_HOLIDAY_STRIPES };
            } else if (hasFrenchHoliday) {
              // Férié français : hachures bleues
              bgColorStyle = { ...FR_HOLIDAY_STRIPES };
            } else if (hasCompanyEvent) {
              // Neutral grey for company events
              bgColorStyle = { backgroundColor: '#9CA3AF' };
            } else if (day.isWeekend) {
              // Slightly darker grey for weekends, distinct from holidays
              bgColorStyle = { backgroundColor: '#E5E7EB' };
            } else {
              bgColor = day.isCurrentMonth ? 'bg-white' : 'bg-cream-50';
            }
            
            return (
            <div
              key={index}
              className={`p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] border rounded-lg transition-all duration-200 ${
                readOnly ? 'cursor-default' : 'cursor-pointer hover:shadow-md'
              } ${bgColor}`}
              style={{
                ...bgColorStyle,
                ...(day.isToday ? { border: '3px solid #d8B11B' } : {})
              }}
              onClick={() => {
                if (readOnly) return;
                // 1. Toggle the local "details panel" for the clicked day.
                setSelectedDate(selectedDate?.toDateString() === day.date.toDateString() ? null : day.date);
                // 2. Surface the click to the parent (e.g. the request form).
                onDayClick?.(day.date);
              }}
            >
              <div className={`text-xs sm:text-sm font-medium ${
                day.isWeekend ? 'text-gray-500' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
              } ${day.isToday ? 'font-bold' : ''}`}
              style={day.isToday ? { color: '#d8B11B' } : {}}
              >
                {day.dayNumber}
              </div>
              
              {/* Monaco Holidays - Display with name (hachures rouges) */}
              {day.monacoHolidays.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {day.monacoHolidays.map((holiday, holidayIndex) => (
                    <div
                      key={`holiday-${holidayIndex}`}
                      className="text-xs p-1 rounded truncate font-medium"
                      style={{ color: '#A23B2D' }}
                      title={`Férié Monaco — ${holiday.title}${holiday.description ? ` • ${holiday.description}` : ''}`}
                    >
                      MC · {holiday.title}
                    </div>
                  ))}
                </div>
              )}

              {/* French Holidays - Display with name (hachures bleues) */}
              {day.frenchHolidays.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {day.frenchHolidays.map((holiday, holidayIndex) => (
                    <div
                      key={`fr-holiday-${holidayIndex}`}
                      className="text-xs p-1 rounded truncate font-medium"
                      style={{ color: '#3E5F8A' }}
                      title={`Férié France — ${holiday.title}`}
                    >
                      FR · {holiday.title}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Company Events - Display with name (pale blue if Monaco holiday exists, otherwise pale red) */}
              {day.companyEvents.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {day.companyEvents.map((event, eventIndex) => (
                    <div
                      key={`event-${eventIndex}`}
                      className="text-xs p-1 rounded truncate font-medium text-ink"
                      title={`${event.title}${event.location ? ` • ${event.location}` : ''}`}
                    >
                      📅 {event.title}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Conflict events - Show ALL without limits */}
              {day.conflictEvents && day.conflictEvents.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {day.conflictEvents.map((conflict, conflictIndex) => (
                    <div
                      key={`conflict-${conflictIndex}`}
                      className="text-xs p-1 rounded truncate font-semibold bg-[#C92B12] text-white"
                      title={`CONFLICT: ${conflict.userName} - ${conflict.company || 'Unknown'} (${conflict.status})`}
                    >
                      ⚠️ {conflict.userName}
                    </div>
                  ))}
                </div>
              )}

              {/* Vacation indicators - Show ALL requests without limits */}
              {day.vacations.length > 0 && (
                <div className="mt-1 space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
                  {day.vacations.map((vacation, reqIndex) => {
                    // Detect if this request has conflicts (overlapping with another for same employee)
                    const hasConflict = detectConflictsForEmployee(
                      vacation.userId,
                      vacation.startDate,
                      vacation.endDate,
                      vacationRequests.map(vr => ({
                        id: vr.id,
                        userId: vr.userId,
                        startDate: vr.startDate,
                        endDate: vr.endDate
                      }))
                    );
                    
                    // Couleur de l'étiquette :
                    //  - conflit → rouge (priorité, inchangé)
                    //  - validé → couleur de l'ENTREPRISE de l'employé
                    //  - pending / autre → couleur de statut habituelle (orange, etc.)
                    const status = (vacation.status || '').toLowerCase();
                    const isValidated = status === 'approved' || status === 'granted';
                    const companyCode = isValidated && !hasConflict
                      ? normalizeCompanyCode(vacation.company)
                      : null;
                    const backgroundColor = hasConflict
                      ? getStatusColor(vacation.status, true)
                      : companyCode
                        ? getCompanyHexColor(companyCode)
                        : getStatusColor(vacation.status);
                    const textColor = '#ffffff'; // Always use white text for visibility
                    
                    return (
                      <div
                        key={reqIndex}
                        className="text-xs p-1 rounded truncate font-medium border border-opacity-20"
                        style={{
                          backgroundColor: backgroundColor,
                          color: textColor,
                          borderColor: `${backgroundColor}cc`
                        }}
                        title={`${vacation.userName} - ${vacation.company || 'Unknown'} (${vacation.status})${hasConflict ? ' ⚠️ CONFLICT' : ''}`}
                      >
                        {vacation.userName} {hasConflict ? '⚠️' : ''}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Conflict indicator */}
              {day.hasConflict && (
                <div className="mt-1">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                    day.severity === 'high' ? 'bg-[#C92B12] text-white' :
                    day.severity === 'medium' ? 'bg-[#F59B42] text-ink' :
                    'bg-gold/10 text-ink'
                  }`}>
                    {day.conflictCount} {day.conflictCount > 1 ? 'conflicts' : 'conflict'}
                  </span>
                </div>
              )}
          </div>
          );
          })}
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
                    <div key={conflict.id} className="flex items-center justify-between p-3 rounded-lg border" style={{ backgroundColor: 'rgba(201, 43, 18, 0.10)', borderColor: 'rgba(201, 43, 18, 0.3)' }}>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span style={{ color: '#C92B12' }}>⚠️</span>
                          <span className="font-bold" style={{ color: '#C92B12' }}>{conflict.userName}</span>
                          <span className="text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider text-white" style={{ backgroundColor: '#C92B12' }}>
                            Conflict
                          </span>
                          <span className="text-xs text-slate-ardoise/60">{conflict.type}</span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: '#C92B12' }}>
                          {conflict.startDate === conflict.endDate ?
                            conflict.startDate :
                            `${conflict.startDate} - ${conflict.endDate}`
                          }
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColorClass(conflict.status)} text-white`}>
                          {conflict.status}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Company Events */}
                {calendarDays
                  .find(d => d.date.toDateString() === selectedDate.toDateString())
                  ?.companyEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gold/10 rounded-lg border border-gold">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-gold">📅</span>
                          <span className="font-bold text-ink">{event.title}</span>
                          <span className="text-sm px-2 py-1 rounded bg-gold/10 text-ink font-medium">
                            Company Event
                          </span>
                        </div>
                        {event.location && (
                          <p className="text-sm text-slate-ardoise mt-1">📍 {event.location}</p>
                        )}
                        <p className="text-xs text-slate-ardoise mt-1">
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
                            style={{ backgroundColor: getCompanyHexColor(normalizeCompanyCode(vacation.company) || 'STARS_MC') }}
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
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${getStatusColorClass(vacation.status)} text-white`}>
                          {vacation.status}
                        </span>
                        {vacation.id === currentRequestId && (
                          <span className="px-2 py-1 text-xs bg-gold/10 text-ink rounded-full font-semibold">
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
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.28)', boxShadow: 'inset 0 0 0 2px #F97316' }}></div>
                  <span className="text-xs sm:text-sm text-slate-ardoise">Requested period</span>
                </div>
              )}
              {conflicts.length > 0 && (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: 'rgba(201, 43, 18, 0.15)', border: '1px solid #C92B12' }}></div>
                  <span className="text-xs sm:text-sm text-slate-ardoise">Conflict day</span>
                </div>
              )}
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={MC_HOLIDAY_STRIPES}></div>
                <span className="text-xs sm:text-sm text-slate-ardoise">Férié Monaco</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={FR_HOLIDAY_STRIPES}></div>
                <span className="text-xs sm:text-sm text-slate-ardoise">Férié France</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: '#9CA3AF' }}></div>
                <span className="text-xs sm:text-sm text-slate-ardoise">Events</span>
              </div>
              {/* Validé = couleur de l'entreprise de l'employé */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm text-slate-ardoise font-medium">Validé :</span>
                {getAllCompanyColors().map(c => (
                  <span key={c.id} className="flex items-center gap-1">
                    <span className="w-3 h-3 sm:w-4 sm:h-4 rounded inline-block" style={{ backgroundColor: c.hex }}></span>
                    <span className="text-xs text-slate-ardoise">{c.name}</span>
                  </span>
                ))}
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: '#F59B42' }}></div>
                <span className="text-xs sm:text-sm text-slate-ardoise">Pending</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded" style={{ backgroundColor: '#C92B12' }}></div>
                <span className="text-xs sm:text-sm text-slate-ardoise">Conflict</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
