'use client';

interface MiniVacationCalendarProps {
  startDate: string;
  endDate: string;
  userName: string;
  company: string;
  type: string;
}

export default function MiniVacationCalendar({ 
  startDate, 
  endDate, 
  userName, 
  company, 
  type 
}: MiniVacationCalendarProps) {
  // Debug logging
  console.log('🔍 MiniVacationCalendar props:', { startDate, endDate, userName, company, type });
  
  // Parse the vacation dates
  const vacationStart = new Date(startDate);
  const vacationEnd = new Date(endDate);
  
  // Debug date parsing
  console.log('🔍 Parsed dates:', { vacationStart, vacationEnd });
  console.log('🔍 Date validity:', { 
    startValid: !isNaN(vacationStart.getTime()), 
    endValid: !isNaN(vacationEnd.getTime()) 
  });
  
  // Validate dates
  if (isNaN(vacationStart.getTime()) || isNaN(vacationEnd.getTime())) {
    console.error('❌ Invalid dates provided to MiniVacationCalendar:', { startDate, endDate });
    return (
      <div style={{
        background: '#fee2e2',
        borderRadius: '8px',
        border: '1px solid #ef4444',
        padding: '12px',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#991b1b', margin: 0, fontSize: '12px' }}>
          ❌ Invalid dates: {startDate} - {endDate}
        </p>
      </div>
    );
  }
  
  // Get the month that contains the vacation period
  const vacationMonth = new Date(vacationStart);
  
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

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(vacationMonth);
  
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Generate calendar days
  const calendarDays = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} style={{ width: '20px', height: '20px' }} />);
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isVacation = isVacationDay(date);
    const isCurrentDay = isToday(date);
    
    calendarDays.push(
      <div
        key={day}
        style={{
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: isVacation ? '600' : '400',
          color: isVacation ? '#92400e' : '#374151',
          backgroundColor: isVacation ? '#fef3c7' : 'transparent',
          border: isVacation ? '1px solid #f59e0b' : 'none',
          borderRadius: '2px',
          position: 'relative'
        }}
      >
        {day}
        {isCurrentDay && (
          <div style={{
            position: 'absolute',
            top: '0',
            right: '0',
            width: '4px',
            height: '4px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }} />
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '12px',
      marginTop: '12px'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '8px'
      }}>
        <h4 style={{
          margin: '0 0 4px 0',
          fontSize: '12px',
          fontWeight: '600',
          color: '#374151'
        }}>
          📅 {monthNames[month]} {year}
        </h4>
        <p style={{
          margin: '0',
          fontSize: '10px',
          color: '#64748b'
        }}>
          {userName} - {company}
        </p>
      </div>

      {/* Mini Calendar Grid */}
      <div style={{ marginBottom: '8px' }}>
        {/* Day Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 20px)',
          gap: '1px',
          marginBottom: '4px'
        }}>
          {dayNames.map(day => (
            <div
              key={day}
              style={{
                width: '20px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: '600',
                color: '#64748b',
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
          gridTemplateColumns: 'repeat(7, 20px)',
          gap: '1px'
        }}>
          {calendarDays}
        </div>
      </div>

      {/* Vacation Period Summary */}
      <div style={{
        textAlign: 'center',
        fontSize: '10px',
        color: '#64748b'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>Start:</strong> {vacationStart.getDate()} {monthNames[vacationStart.getMonth()]}
        </div>
        <div style={{ marginBottom: '4px' }}>
          <strong>End:</strong> {vacationEnd.getDate()} {monthNames[vacationEnd.getMonth()]}
        </div>
        <div>
          <strong>Duration:</strong> {Math.ceil((vacationEnd.getTime() - vacationStart.getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginTop: '8px',
        fontSize: '8px',
        color: '#64748b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '1px'
          }} />
          <span>Vacation</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{
            width: '4px',
            height: '4px',
            backgroundColor: '#ef4444',
            borderRadius: '50%'
          }} />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
