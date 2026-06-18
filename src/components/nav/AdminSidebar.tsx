'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

/**
 * Sidebar du back office Vacation Management — aligné sur le layout admin de
 * référence du portail RH (charte SLG : sidebar cream, item actif ink, focus
 * doré, cibles ≥ 44px). Le gating admin est fait côté serveur (admin/layout.tsx).
 */
const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || 'https://stars-hr-portal-preview.vercel.app';

type Item = { key: string; path: string };

const ITEMS: Item[] = [
  { key: 'vacationRequests', path: '/admin/vacation-requests' },
  { key: 'setup', path: '/admin/setup' },
  { key: 'analytics', path: '/admin/analytics' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const tNav = useTranslations('nav');
  const currentLocale = pathname?.split('/')[1] || 'en';

  const isActive = (path: string) => !!pathname && pathname.includes(path);

  return (
    <nav
      aria-label={tNav('administration')}
      className="border-b border-ink-900/10 bg-cream-50 px-3 py-4 lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r lg:py-6"
    >
      <p className="px-3 pb-3 text-[11px] uppercase tracking-widest text-ink-700/70">
        {tNav('administration')}
      </p>

      <ul className="flex flex-wrap gap-1 lg:flex-col">
        {ITEMS.map((it) => {
          const active = isActive(it.path);
          return (
            <li key={it.key}>
              <Link
                href={createLocaleUrl(it.path, currentLocale)}
                aria-current={active ? 'page' : undefined}
                className={[
                  'flex min-h-[44px] items-center rounded-sm px-3 py-2 text-sm transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
                  active ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-ink-900/5',
                ].join(' ')}
              >
                {tNav(it.key)}
              </Link>
            </li>
          );
        })}
      </ul>

      <a
        href={`${PORTAL_URL}/dashboard`}
        className="mt-1 flex min-h-[44px] items-center gap-2 rounded-sm px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 lg:mt-4 lg:border-t lg:border-ink-900/10 lg:pt-4"
      >
        <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        {tNav('portalHome')}
      </a>
    </nav>
  );
}
