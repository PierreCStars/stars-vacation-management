'use client';

import { useState, useEffect, type ReactElement } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { createLocaleUrl } from '@/i18n/routing';
import { isAdmin } from '@/config/admins';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Footer } from './Footer';
import { SignOutButton } from '../SignOutButton';
import Avatar from '../Avatar';
import ForbiddenDatesNotice from '../ForbiddenDatesNotice';

const PORTAL_URL =
  process.env.NEXT_PUBLIC_PORTAL_URL || 'https://stars-hr-portal-preview.vercel.app';

const COLLAPSE_KEY = 'svm-sidebar-collapsed';

/* Monoline icons (24-grid, 1.5 stroke, currentColor) — aligned with the SLG
   house icon style. Kept inline so the shell has no external icon dependency. */
type IconProps = { className?: string };
const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
function IconRequest({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M9 4h6a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1Z" />
      <path d="M8 5H6a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}
function IconInbox({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M4 13h4l1.5 2.5h5L16 13h4" />
      <path d="M4 13 6 5h12l2 8v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
    </svg>
  );
}
function IconSliders({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M5 8h9M18 8h1M5 16h1M10 16h9" />
      <circle cx="16" cy="8" r="2" />
      <circle cx="8" cy="16" r="2" />
    </svg>
  );
}
function IconChart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M5 4v15a1 1 0 0 0 1 1h14" />
      <path d="M8 16v-3M12 16v-6M16 16v-4" />
    </svg>
  );
}
function IconPortal({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M10 19l-7-7 7-7M3 12h18" />
    </svg>
  );
}
function IconLogout({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...stroke}>
      <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8l-4 4 4 4M6 12h11" />
    </svg>
  );
}

type NavItem = { key: string; path: string; label: string; Icon: (p: IconProps) => ReactElement };

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tVacations = useTranslations('vacations');
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Desktop-only: collapse the sidebar to an icon rail. Persisted so the choice
  // survives navigation/reload. Starts expanded on the server + first paint
  // (avoids hydration mismatch); the stored value is applied in an effect.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === '1') setCollapsed(true);
    } catch {}
  }, []);
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      try { localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0'); } catch {}
      return next;
    });

  const currentLocale = pathname?.split('/')[1] || 'en';
  // Path without the locale prefix, e.g. "/admin/vacation-requests".
  const path = '/' + (pathname?.split('/').slice(2).join('/') ?? '');
  const admin = isAdmin(session?.user?.email);

  const isActive = (itemPath: string) =>
    path === itemPath || path.startsWith(itemPath + '/');

  const mainItems: NavItem[] = [
    { key: 'request', path: '/vacation-request', label: tVacations('request'), Icon: IconRequest },
  ];

  const adminItems: NavItem[] = [
    { key: 'requests', path: '/admin/vacation-requests', label: tNav('vacationRequests'), Icon: IconInbox },
    { key: 'setup', path: '/admin/setup', label: tNav('setup'), Icon: IconSliders },
    { key: 'analytics', path: '/admin/analytics', label: tNav('analytics'), Icon: IconChart },
  ];

  const linkClass = (active: boolean, rail: boolean) =>
    [
      'flex min-h-[44px] items-center gap-3 rounded-sm border-b-0 py-2 text-sm no-underline transition-colors',
      rail ? 'justify-center px-0' : 'px-3',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
      active ? 'bg-ink-900 text-cream-50' : 'text-ink-700 hover:bg-ink-900/5',
    ].join(' ');

  const renderNav = (onNavigate?: () => void, rail = false) => (
    <nav aria-label={tNav('administration')} className="flex w-full flex-1 flex-col gap-1">
      <ul className="flex w-full flex-col gap-1">
        {mainItems.map(({ key, path: p, label, Icon }) => (
          <li key={key}>
            <Link
              href={createLocaleUrl(p, currentLocale)}
              aria-current={isActive(p) ? 'page' : undefined}
              aria-label={label}
              title={rail ? label : undefined}
              onClick={onNavigate}
              className={linkClass(isActive(p), rail)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!rail && <span className="truncate">{label}</span>}
            </Link>
          </li>
        ))}
      </ul>

      {admin && (
        <div className="mt-5 w-full">
          {rail ? (
            <div className="mx-2 mb-2 border-t border-ink-900/10" />
          ) : (
            <p className="px-3 pb-2 text-[11px] uppercase tracking-widest text-ink-700/60">
              {tNav('administration')}
            </p>
          )}
          <ul className="flex w-full flex-col gap-1">
            {adminItems.map(({ key, path: p, label, Icon }) => (
              <li key={key}>
                <Link
                  href={createLocaleUrl(p, currentLocale)}
                  aria-current={isActive(p) ? 'page' : undefined}
                  aria-label={label}
                  title={rail ? label : undefined}
                  onClick={onNavigate}
                  className={linkClass(isActive(p), rail)}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!rail && <span className="truncate">{label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto w-full pt-5">
        <a
          href={`${PORTAL_URL}/dashboard`}
          aria-label={tNav('portalHome')}
          title={rail ? tNav('portalHome') : undefined}
          className={[
            'flex min-h-[44px] items-center gap-3 rounded-sm border-b-0 border-t border-ink-900/10 py-2 pt-4 text-sm text-ink-700 no-underline transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400',
            rail ? 'justify-center px-0' : 'px-3',
          ].join(' ')}
        >
          <IconPortal className="h-5 w-5 shrink-0" />
          {!rail && tNav('portalHome')}
        </a>
      </div>
    </nav>
  );

  const renderProfile = (rail = false) => {
    if (rail) {
      return (
        <div className="mt-4 flex w-full flex-col items-center gap-3 border-t border-ink-900/10 pt-4">
          {session?.user && (
            <>
              <Avatar
                name={session.user.name || session.user.email || 'User'}
                src={session.user.image}
                size={36}
              />
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                aria-label={tCommon('logout')}
                title={tCommon('logout')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <IconLogout className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      );
    }
    return (
      <div className="mt-4 border-t border-ink-900/10 pt-4">
        {session?.user ? (
          <div className="flex items-center gap-3">
            <Avatar
              name={session.user.name || session.user.email || 'User'}
              src={session.user.image}
              size={36}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">
                {session.user.name || session.user.email}
              </p>
              {session.user.name && (
                <p className="truncate text-xs text-ink-700/70">{session.user.email}</p>
              )}
            </div>
          </div>
        ) : (
          <p className="px-1 text-xs uppercase tracking-widest text-ink-700/60">
            {tCommon('login')}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <LanguageSwitcher />
          {session?.user && <SignOutButton />}
        </div>
      </div>
    );
  };

  const renderBrand = (showWordmark: boolean) => (
    <a
      href={`${PORTAL_URL}/dashboard`}
      className="flex items-center gap-2 border-b-0 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
      aria-label={tNav('portalHome')}
    >
      {/* SLG brand rule: logo never deformed — real intrinsic ratio (1894×1339),
          sized via h-* w-auto only. */}
      <Image src="/stars-logo.png" alt="Stars" width={1894} height={1339} className="h-8 w-auto" priority />
      {showWordmark && (
        <span className="text-xs font-medium uppercase tracking-[0.25em] text-ink-700/70">
          {tCommon('appName')}
        </span>
      )}
    </a>
  );

  const collapseLabel = collapsed ? tNav('expandSidebar') : tNav('collapseSidebar');

  return (
    <div className="flex min-h-dvh flex-col bg-cream-50 lg:flex-row">
      {/* Desktop sidebar — collapsible to an icon rail */}
      <aside
        className={[
          'sticky top-0 hidden h-dvh shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-ink-900/10 bg-cream-50 py-6 transition-[width] duration-200 ease-out motion-reduce:transition-none lg:flex',
          collapsed ? 'w-[4.5rem] items-center px-2' : 'w-64 px-4',
        ].join(' ')}
      >
        <div
          className={[
            'w-full pb-6',
            collapsed ? 'flex flex-col items-center gap-3' : 'flex items-center justify-between px-1',
          ].join(' ')}
        >
          {renderBrand(!collapsed)}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapseLabel}
            title={collapseLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-ink-700 transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" {...stroke}>
              {collapsed ? (
                <path d="M13 7l5 5-5 5M6 7l5 5-5 5" />
              ) : (
                <path d="M11 7l-5 5 5 5M18 7l-5 5 5 5" />
              )}
            </svg>
          </button>
        </div>
        {renderNav(undefined, collapsed)}
        {renderProfile(collapsed)}
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-ink-900/10 bg-cream-50 px-4 lg:hidden">
        {renderBrand(true)}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={tNav('administration')}
            aria-expanded={drawerOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink-900 hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" {...stroke}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer (always full labels) */}
      {drawerOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 z-40 bg-ink-900/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85%] flex-col overflow-y-auto bg-cream-50 px-4 py-6 shadow-xl">
            <div className="flex items-center justify-between px-1 pb-6">
              {renderBrand(true)}
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label={tCommon('close')}
                className="inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink-900 hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" {...stroke}>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            {renderNav(() => setDrawerOpen(false))}
            {renderProfile()}
          </div>
        </div>
      )}

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
        <Footer />
      </div>

      <ForbiddenDatesNotice />
    </div>
  );
}
