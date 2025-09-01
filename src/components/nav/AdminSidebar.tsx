'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createLocaleUrl } from '@/i18n/routing';

export function AdminSidebar() {
  const pathname = usePathname();
  const currentLocale = pathname?.split('/')[1] || 'en';

  const isActive = (href: string) => pathname.includes(href);

  return (
    <div className="w-64 bg-white shadow-lg min-h-screen">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Admin Panel</h2>
        
        <nav className="space-y-2">
          <Link
            href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/admin/vacation-requests')
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Vacation Requests
          </Link>
          
          <Link
            href={createLocaleUrl('/admin/analytics', currentLocale)}
            className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/admin/analytics')
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Analytics
          </Link>
        </nav>
      </div>
    </div>
  );
}
