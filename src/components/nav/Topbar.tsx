'use client';
import { usePathname } from 'next/navigation';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Topbar() {
  const pathname = usePathname();
  const t = useTranslations();
  const currentLocale = pathname.split('/')[1] || 'en';

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className="
        sticky top-0 inset-x-0 z-50
        bg-white/95 backdrop-blur
        border-b
        overflow-visible
      "
      role="navigation"
      aria-label="Main"
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo → Dashboard via "/" (middleware/localized) */}
        <Link href={createLocaleUrl('/', currentLocale)} className="flex items-center gap-2 shrink-0" aria-label="Go to Dashboard">
          <div className="h-8 w-8 rounded bg-black" />
          <span className="hidden sm:inline font-semibold truncate">
            {t('common.appName', { default: 'Stars Vacation' })}
          </span>
        </Link>

        {/* Main nav — no overflow, no inner scrollbars */}
        <nav className="flex items-center gap-4 flex-wrap overflow-visible">
          <Link
            href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              isActive('/admin/vacation-requests')
                ? 'bg-black text-white'
                : 'hover:bg-gray-100'
            }`}
          >
            {t('nav.vacationRequests', { default: 'Vacation Requests' })}
          </Link>

          <div className="h-14" />
          <Link
            href={createLocaleUrl('/admin', currentLocale)}
            className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${
              isActive('/admin') ? 'bg-black text-white' : 'hover:bg-gray-100'
            }`}
          >
            {t('nav.administration', { default: 'Administration' })}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
