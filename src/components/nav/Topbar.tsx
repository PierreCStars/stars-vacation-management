'use client';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { createLocaleUrl } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useSession } from 'next-auth/react';
import { SignOutButton } from '../SignOutButton';
import Avatar from '../Avatar';
import { isAdmin } from '@/config/admins';
import { AdminDropdown } from './AdminDropdown';

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const currentLocale = pathname?.split('/')[1] || 'en';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Le logo renvoie au dashboard du PORTAIL RH (le module congés est une tuile
  // du portail). Configurable via env pour basculer sur portal.stars.mc en prod.
  const portalDashboard = `${process.env.NEXT_PUBLIC_PORTAL_URL || 'https://stars-hr-portal-preview.vercel.app'}/dashboard`;
  // Sur les pages /admin, la nav admin est dans la sidebar → on masque le
  // doublon dans la top bar.
  const onAdminRoute = !!pathname && pathname.includes('/admin');

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/') || false;

  const navLinkClass = (active: boolean) =>
    `no-underline px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
      active
        ? 'text-white border-gold'
        : 'text-white/70 border-transparent hover:text-white hover:border-gold/60'
    }`;

  return (
    <header
      className="sticky top-0 z-50 bg-ink border-b border-gold/50"
      role="navigation"
      aria-label="Main"
    >
      <div className="slg-container flex h-16 items-center justify-between">
        {/* Logo + wordmark — renvoie au dashboard du portail RH */}
        <a
          href={portalDashboard}
          className="no-underline flex items-center gap-3 shrink-0 group"
          aria-label="Aller au portail RH"
        >
          {/* Real intrinsic aspect ratio: 1894x1339 (~1.41). NEVER force a
              square box on the logo — preserve the source ratio at all sizes
              (SLG brand rule: the logo is never deformed). */}
          <Image
            src="/stars-logo.png"
            alt="Stars Logo"
            width={1894}
            height={1339}
            className="h-9 w-auto transition-transform group-hover:scale-105"
            priority
          />
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/60 font-medium">
              Star Luxury Group
            </span>
            <span className="text-sm font-semibold tracking-wide text-white mt-0.5">
              {tCommon('appName')}
            </span>
          </span>
        </a>

        {/* Main navigation - Desktop */}
        <nav className="hidden md:flex items-end gap-2 h-full">
          <Link
            href={createLocaleUrl('/dashboard', currentLocale)}
            className={navLinkClass(isActive('/dashboard'))}
          >
            {tNav('dashboard')}
          </Link>

          <Link
            href={createLocaleUrl('/vacation-request', currentLocale)}
            className={navLinkClass(isActive('/vacation-request'))}
          >
            {tNav('vacationRequests')}
          </Link>

          {isAdmin(session?.user?.email) && !onAdminRoute && (
            <AdminDropdown currentLocale={currentLocale} />
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {session?.user ? (
            <div className="hidden sm:flex items-center gap-3">
              <Avatar
                name={session.user.name || session.user.email || 'User'}
                src={session.user.image}
              />
              <SignOutButton />
            </div>
          ) : (
            <div className="hidden sm:block text-xs uppercase tracking-widest text-white/70">
              Not signed in
            </div>
          )}

          {/* Mobile hamburger — surfaces nav + sign-out on viewports < md
              where the desktop nav is hidden. */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(v => !v)}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu panel — full-width dropdown under the header, only on < md */}
      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden bg-ink border-t border-white/10">
          <nav className="slg-container py-3 flex flex-col gap-1">
            <Link
              href={createLocaleUrl('/dashboard', currentLocale)}
              onClick={() => setMobileMenuOpen(false)}
              className={`no-underline px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/dashboard') ? 'text-white border-l-2 border-gold pl-3' : 'text-white/80 hover:text-white pl-3'
              }`}
            >
              {tNav('dashboard')}
            </Link>
            <Link
              href={createLocaleUrl('/vacation-request', currentLocale)}
              onClick={() => setMobileMenuOpen(false)}
              className={`no-underline px-3 py-2 text-sm font-medium transition-colors ${
                isActive('/vacation-request') ? 'text-white border-l-2 border-gold pl-3' : 'text-white/80 hover:text-white pl-3'
              }`}
            >
              {tNav('vacationRequests')}
            </Link>
            {isAdmin(session?.user?.email) && !onAdminRoute && (
              <>
                <Link
                  href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`no-underline px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/vacation-requests') ? 'text-white border-l-2 border-gold pl-3' : 'text-white/80 hover:text-white pl-3'
                  }`}
                >
                  {tNav('administration')} — {tNav('vacationRequests')}
                </Link>
                <Link
                  href={createLocaleUrl('/admin/analytics', currentLocale)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`no-underline px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/analytics') ? 'text-white border-l-2 border-gold pl-3' : 'text-white/80 hover:text-white pl-3'
                  }`}
                >
                  {tNav('administration')} — {tNav('analytics')}
                </Link>
                <Link
                  href={createLocaleUrl('/admin/setup', currentLocale)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`no-underline px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin/setup') ? 'text-white border-l-2 border-gold pl-3' : 'text-white/80 hover:text-white pl-3'
                  }`}
                >
                  {tNav('administration')} — {tNav('setup')}
                </Link>
              </>
            )}
            {/* Avatar + Sign out collapse here on small screens since the
                right-side controls are hidden via `hidden sm:flex`. */}
            {session?.user && (
              <div className="mt-2 pt-3 border-t border-white/10 flex items-center gap-3 sm:hidden">
                <Avatar
                  name={session.user.name || session.user.email || 'User'}
                  src={session.user.image}
                />
                <span className="text-xs text-white/70 truncate">{session.user.email}</span>
                <span className="ml-auto"><SignOutButton /></span>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
