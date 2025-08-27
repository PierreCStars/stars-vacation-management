'use client';

export default function TestCalendar() {
  return (
    <div style={{
      background: '#f0f9ff',
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '16px',
      margin: '16px 0',
      textAlign: 'center'
    }}>
      <h3 style={{ color: '#1e40af', margin: '0 0 8px 0' }}>
        🗓️ Test Calendar Component
      </h3>
      <p style={{ color: '#374151', margin: 0 }}>
        This is a test component to verify imports are working.
      </p>
      <div style={{
        marginTop: '12px',
        padding: '8px',
        background: '#dbeafe',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        ✅ Component loaded successfully!
      </div>
    </div>
  );
}
