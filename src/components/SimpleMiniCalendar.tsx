'use client';

interface SimpleMiniCalendarProps {
  startDate: string;
  endDate: string;
  userName: string;
  company: string;
  type: string;
}

export default function SimpleMiniCalendar({ 
  startDate, 
  endDate, 
  userName, 
  company, 
  type 
}: SimpleMiniCalendarProps) {
  console.log('🔍 SimpleMiniCalendar rendering with props:', { startDate, endDate, userName, company, type });
  
  return (
    <div style={{
      background: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '12px',
      margin: '12px 0',
      textAlign: 'center'
    }}>
      <h4 style={{ color: '#1e40af', margin: '0 0 8px 0', fontSize: '14px' }}>
        📅 Mini Calendar
      </h4>
      <p style={{ color: '#374151', margin: '0 0 8px 0', fontSize: '12px' }}>
        {userName} - {company}
      </p>
      <div style={{ fontSize: '11px', color: '#64748b' }}>
        <div>Start: {startDate}</div>
        <div>End: {endDate}</div>
        <div>Type: {type}</div>
      </div>
      <div style={{
        marginTop: '8px',
        padding: '4px 8px',
        background: '#dbeafe',
        borderRadius: '4px',
        fontSize: '10px',
        color: '#1e40af'
      }}>
        ✅ Calendar Component Working!
      </div>
    </div>
  );
}
