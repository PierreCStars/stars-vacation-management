'use client';

import UnifiedVacationCalendar from './UnifiedVacationCalendar';

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
  // Create a mock vacation request for the unified calendar
  const mockVacationRequest = {
    id: 'mini-calendar',
    userId: 'mini',
    userEmail: 'mini@example.com',
    userName,
    startDate,
    endDate,
    company,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reason: ''
  };

  return (
    <div style={{
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      padding: '12px',
      marginTop: '12px'
    }}>
      <UnifiedVacationCalendar
        vacationRequests={[mockVacationRequest]}
        currentRequestId={undefined}
        showLegend={false}
        compact={true}
        className="mini-calendar"
      />
    </div>
  );
}
