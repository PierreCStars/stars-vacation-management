'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tNav = useTranslations('nav');
  const currentLocale = pathname?.split('/')[1] || 'en';

  const isActive = (href: string) => pathname?.includes(href) || false;

  // Only show admin sidebar for admin users
  const isAdmin = session?.user?.email === 'johnny@stars.mc' || 
                  session?.user?.email === 'pierre@stars.mc' || 
                  session?.user?.email === 'daniel@stars.mc' || 
                  session?.user?.email === 'compta@stars.mc';

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="hidden lg:block w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{tNav('administration')}</h2>
        
        <nav className="space-y-1">
          <Link
            href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
            className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive('/admin/vacation-requests')
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {tNav('vacationRequests')}
            </div>
          </Link>
          
          <Link
            href={createLocaleUrl('/admin/analytics', currentLocale)}
            className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              isActive('/admin/analytics')
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {tNav('analytics')}
            </div>
          </Link>
        </nav>
      </div>
    </div>
  );
}
