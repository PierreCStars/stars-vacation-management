'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import CompanyLegend from './ui/CompanyLegend';

// Specific calendar ID for the Stars vacation calendar
const STARS_VACATION_CALENDAR_ID = 'c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com';

interface GoogleCalendarProps {
  _calendarId?: string;
  height?: string;
  title?: string;
  _userEmail?: string;
}

export default function GoogleCalendar({ 
  _calendarId = STARS_VACATION_CALENDAR_ID, 
  height = '400px',
  title = 'Stars Vacation Calendar',
  _userEmail
}: GoogleCalendarProps) {
  const tCalendar = useTranslations('calendar');
  const [currentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'WEEK' | 'MONTH'>('WEEK');



  const getDisplayText = () => {
    if (viewMode === 'WEEK') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const openCalendarInNewTab = () => {
    const url = `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(STARS_VACATION_CALENDAR_ID)}`;
    window.open(url, '_blank');
  };

  const getCalendarName = () => {
    return title;
  };

  // Render company color legend
  const renderCompanyLegend = () => {
    return (
      <div style={{ marginTop: '16px' }}>
        <CompanyLegend title="Company Color Legend" compact={true} />
      </div>
    );
  };

  // Show a calendar placeholder instead of trying to embed
  const renderCalendarPlaceholder = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      days.push(day);
    }

    return (
      <div style={{
        height: height,
        background: '#f8fafc',
        borderRadius: '8px',
        border: '2px dashed #cbd5e1',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Calendar Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              textAlign: 'center',
              fontWeight: '600',
              color: '#64748b',
              fontSize: '14px',
              padding: '8px'
            }}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px',
          flex: 1
        }}>
          {days.map((day, index) => {
            const isToday = day.toDateString() === new Date().toDateString();
            return (
              <div key={index} style={{
                background: isToday ? '#3b82f6' : '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '8px',
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                color: isToday ? 'white' : '#374151',
                fontWeight: isToday ? '600' : '400'
              }}>
                <span style={{ fontSize: '14px' }}>
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <button
            onClick={openCalendarInNewTab}
            style={{
              padding: '10px 20px',
              borderRadius: '3px',
              border: '1px solid #3b82f6',
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3b82f6'}
          >
            {tCalendar('openFullCalendar')}
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>{tCalendar('teamVacationCalendar')}</strong> - {tCalendar('weekOf')} {getDisplayText()}
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            {tCalendar('clickOpenFullCalendar')}
          </p>
          <p style={{ margin: 0 }}>
            {tCalendar('bestExperience')}
          </p>
        </div>

        {/* Company Color Legend */}
        {renderCompanyLegend()}
      </div>
    );
  };

  return (
    <div style={{ 
      background: '#fff', 
      borderRadius: '12px', 
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Information text above calendar */}
      <div style={{
        padding: '12px 20px',
        background: '#f0f9ff',
        borderBottom: '1px solid #e2e8f0',
        textAlign: 'center'
      }}>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#1e40af',
          fontWeight: '500'
        }}>
          {tCalendar('switchToFullMode')}
        </p>
      </div>

      <div style={{ 
        padding: '16px 20px', 
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b' 
          }}>
            {getCalendarName()}
          </h3>
          <p style={{ 
            margin: '4px 0 0 0', 
            fontSize: '12px', 
            color: '#64748b',
            fontStyle: 'italic'
          }}>
            {tCalendar('calendarPreview')}
          </p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
            <button
              onClick={() => setViewMode('WEEK')}
              style={{
                padding: '6px 12px',
                borderRadius: '3px',
                border: 'none',
                background: viewMode === 'WEEK' ? '#3b82f6' : 'transparent',
                color: viewMode === 'WEEK' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('MONTH')}
              style={{
                padding: '6px 12px',
                borderRadius: '3px',
                border: 'none',
                background: viewMode === 'MONTH' ? '#3b82f6' : 'transparent',
                color: viewMode === 'MONTH' ? 'white' : '#64748b',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Month
            </button>
          </div>
          
          {/* Current Date Display */}
          <span style={{ 
            fontSize: '14px', 
            fontWeight: '500', 
            color: '#374151',
            minWidth: '120px',
            textAlign: 'center'
          }}>
            {getDisplayText()}
          </span>

          <button
            onClick={openCalendarInNewTab}
            style={{
              padding: '8px 12px',
              borderRadius: '3px',
              border: '1px solid #10b981',
              background: '#10b981',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
          >
            Open Full
          </button>
        </div>
      </div>
      
      <div style={{ padding: '16px' }}>
        {renderCalendarPlaceholder()}
      </div>
    </div>
  );
} 