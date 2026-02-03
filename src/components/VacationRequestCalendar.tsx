'use client';

import { useState, useEffect } from 'react';
import { getCompanyHexColor } from '@/lib/company-colors';

interface VacationRequestCalendarProps {
  startDate: string;
  endDate: string;
  userName: string;
  company: string;
  type: string;
}

export default function VacationRequestCalendar({ 
  startDate, 
  endDate, 
  userName, 
  company, 
  type 
}: VacationRequestCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Parse the vacation dates
  const vacationStart = new Date(startDate);
  const vacationEnd = new Date(endDate);
  
  // Set current month to show the vacation period
  useEffect(() => {
    setCurrentMonth(new Date(vacationStart));
  }, [startDate]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const isVacationDay = (date: Date) => {
    const day = date.getTime();
    return day >= vacationStart.getTime() && day <= vacationEnd.getTime();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const getNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="calendar-day empty" />);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isVacation = isVacationDay(date);
    const isCurrentDay = isToday(date);
    
    calendarDays.push(
      <div
        key={day}
        className={`calendar-day ${isVacation ? 'vacation-day' : ''} ${isCurrentDay ? 'today' : ''}`}
        style={{
          padding: '8px',
          textAlign: 'center',
          border: isCurrentDay ? '3px solid #d8B11B' : '1px solid #e2e8f0',
          position: 'relative',
          minHeight: '60px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isVacation ? getCompanyHexColor(company) : '#ffffff',
          borderColor: isCurrentDay ? '#d8B11B' : (isVacation ? '#374151' : '#e2e8f0'),
          fontWeight: isVacation ? '600' : '400',
          color: isVacation ? '#ffffff' : (isCurrentDay ? '#d8B11B' : '#374151')
        }}
      >
        <span style={{ fontSize: '14px', marginBottom: '4px' }}>{day}</span>
        {isVacation && (
          <div style={{
            fontSize: '10px',
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {day === vacationStart.getDate() && month === vacationStart.getMonth() ? 'START' : ''}
            {day === vacationEnd.getDate() && month === vacationEnd.getMonth() ? 'END' : ''}
            {day > vacationStart.getDate() && day < vacationEnd.getDate() ? 'VACATION' : ''}
          </div>
        )}
        {isCurrentDay && (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            width: '8px',
            height: '8px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }} />
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Vacation Request Calendar
        </h3>
        <p style={{
          margin: '0',
          fontSize: '14px',
          opacity: '0.9'
        }}>
          {userName} - {company} - {type.replace('_', ' ')}
        </p>
      </div>

      {/* Month Navigation */}
      <div style={{
        padding: '16px 20px',
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={getPreviousMonth}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          ← Previous
        </button>
        
        <h4 style={{
          margin: '0',
          fontSize: '18px',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {monthNames[month]} {year}
        </h4>
        
        <button
          onClick={getNextMonth}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            background: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151'
          }}
        >
          Next →
        </button>
      </div>

      {/* Vacation Period Summary */}
      <div style={{
        padding: '16px 20px',
        background: '#fef3c7',
        borderBottom: '1px solid #f59e0b',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <strong style={{ color: '#92400e' }}>Start Date:</strong>
            <br />
            <span style={{ color: '#92400e' }}>
              {vacationStart.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div>
            <strong style={{ color: '#92400e' }}>End Date:</strong>
            <br />
            <span style={{ color: '#92400e' }}>
              {vacationEnd.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
          <div>
            <strong style={{ color: '#92400e' }}>Duration:</strong>
            <br />
            <span style={{ color: '#92400e' }}>
              {Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ padding: '16px' }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          marginBottom: '8px'
        }}>
          {dayNames.map(day => (
            <div
              key={day}
              style={{
                padding: '8px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#64748b',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px'
        }}>
          {calendarDays}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        padding: '16px 20px',
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#fef3c7',
              border: '2px solid #f59e0b',
              borderRadius: '4px'
            }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Vacation Period</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: '#ffffff',
              border: '2px solid #e2e8f0',
              borderRadius: '4px'
            }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Regular Day</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#ef4444',
              borderRadius: '50%'
            }} />
            <span style={{ fontSize: '12px', color: '#64748b' }}>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
