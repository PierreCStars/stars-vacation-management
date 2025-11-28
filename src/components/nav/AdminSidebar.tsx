'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { isAdmin } from '@/config/admins';

export function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tNav = useTranslations('nav');
  const currentLocale = pathname?.split('/')[1] || 'en';

  const isActive = (href: string) => pathname?.includes(href) || false;

  // Only show admin sidebar for admin users
  const isAdminUser = isAdmin(session?.user?.email);

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="hidden lg:block w-64 bg-white shadow-sm border-r min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">{tNav('administration')}</h2>
        
        <nav className="space-y-4">
          {/* Management Section */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
              {tNav('managementSection')}
            </div>
            <div className="space-y-1">
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
                href={createLocaleUrl('/admin/setup', currentLocale)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/setup')
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {tNav('setup')}
                </div>
              </Link>
            </div>
          </div>

          {/* Analytics Section */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-4">
              {tNav('analyticsSection')}
            </div>
            <div className="space-y-1">
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
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
