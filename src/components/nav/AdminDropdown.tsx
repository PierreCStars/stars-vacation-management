'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

interface AdminDropdownProps {
  currentLocale: string;
}

export function AdminDropdown({ currentLocale }: AdminDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const tNav = useTranslations('nav');

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/') || false;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const hasActiveChild = isActive('/admin/vacation-requests') || isActive('/admin/analytics');

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
          hasActiveChild
            ? 'bg-indigo-100 text-indigo-700'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={tNav('administration')}
      >
        {tNav('administration')}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {/* Management Section */}
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {tNav('managementSection')}
            </div>
            <Link
              href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                isActive('/admin/vacation-requests')
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {tNav('vacationRequests')}
              </div>
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-1" />

          {/* Analytics Section */}
          <div className="px-4 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {tNav('analyticsSection')}
            </div>
            <Link
              href={createLocaleUrl('/admin/analytics', currentLocale)}
              onClick={() => setIsOpen(false)}
              className={`block px-4 py-2 rounded-md text-sm transition-colors ${
                isActive('/admin/analytics')
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {tNav('analytics')}
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

