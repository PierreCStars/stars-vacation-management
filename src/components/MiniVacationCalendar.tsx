'use client';

import UnifiedVacationCalendar from './UnifiedVacationCalendar';
import { VacationRequest } from '@/types/vacation';
import { VacationStatus } from '@/types/vacation-status';

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
  const mockVacationRequest: VacationRequest = {
    id: 'mini-calendar',
    userId: 'mini',
    userEmail: 'mini@example.com',
    userName,
    startDate,
    endDate,
    company,
    type,
    status: 'pending' as VacationStatus,
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
        showLegend={true}
        compact={true}
        className="mini-calendar"
      />
    </div>
  );
}
