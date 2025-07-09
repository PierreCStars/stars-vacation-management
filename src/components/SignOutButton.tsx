'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn-secondary hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-400 transition-all duration-200"
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '0.75rem 1.5rem', 
        fontSize: '1rem', 
        fontWeight: '500', 
        color: '#6b7280', 
        backgroundColor: 'white', 
        border: '2px solid #d1d5db', 
        borderRadius: '0.5rem', 
        textDecoration: 'none',
        fontFamily: 'Montserrat, sans-serif',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s ease-in-out',
        transform: 'translateY(0)'
      }}
    >
      Sign Out
    </button>
  );
} 