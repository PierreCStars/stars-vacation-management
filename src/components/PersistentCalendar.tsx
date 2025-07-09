'use client';

import GoogleCalendar from './GoogleCalendar';

export default function PersistentCalendar() {
  // Show the calendar in a centered container below page content
  return (
    <div
      className="w-full max-w-4xl mx-auto mt-4 mb-8 bg-white rounded-lg shadow-lg border border-gray-200"
      style={{
        maxWidth: '1024px',
        margin: '1rem auto 2rem auto',
        background: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <div
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg"
        style={{
          background: 'linear-gradient(to right, #2563eb, #1d4ed8)',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.75rem 0.75rem 0 0',
        }}
      >
        <h3
          className="font-semibold text-lg"
          style={{
            fontWeight: '600',
            fontSize: '1.125rem',
            margin: 0,
          }}
        >
          Stars Vacation Calendar
        </h3>
      </div>
      
      <div
        className="p-4"
        style={{
          padding: '1rem',
          minHeight: '500px',
        }}
      >
        <GoogleCalendar />
      </div>
    </div>
  );
} 