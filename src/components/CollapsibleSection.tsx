'use client';

import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false,
  className = ''
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`card ${className} ${!isOpen ? 'collapsed-section' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left p-3 rounded-lg transition-all duration-200 ${
          isOpen 
            ? 'mb-4 hover:bg-gray-50 bg-gray-50' 
            : 'hover:bg-blue-50 bg-blue-50 border border-blue-200 hover:border-blue-300 hover:shadow-sm'
        }`}
      >
        <h3 className={`font-semibold transition-colors duration-200 ${
          isOpen ? 'text-xl text-gray-900' : 'text-lg text-blue-700'
        }`}>
          {title}
        </h3>
        <div className="flex items-center space-x-3">
          <span className={`text-sm transition-colors duration-200 ${
            isOpen ? 'text-gray-500' : 'text-blue-600'
          }`}>
            {isOpen ? 'Click to collapse' : 'Click to expand'}
          </span>
          <div className={`p-1 rounded-full transition-all duration-200 ${
            isOpen ? 'bg-gray-200' : 'bg-blue-200'
          }`}>
            <svg
              className={`w-5 h-5 transition-all duration-200 ${
                isOpen ? 'rotate-180 text-gray-600' : 'text-blue-600'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      <div className={`transition-all duration-300 ease-in-out ${
        isOpen 
          ? 'max-h-screen opacity-100 mb-0' 
          : 'max-h-0 opacity-0 overflow-hidden mb-0'
      }`}>
        {children}
      </div>
      
      {/* Collapsed state indicator */}
      {!isOpen && (
        <div className="text-center py-3 text-gray-500 text-sm bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 animate-pulse">
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="text-blue-600 font-medium">Click to expand section</span>
          </div>
        </div>
      )}
    </div>
  );
}
