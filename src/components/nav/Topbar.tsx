'use client';
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

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/') || false;

  const navLinkClass = (active: boolean) =>
    `px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
      active
        ? 'text-ink border-gold'
        : 'text-slate-ardoise border-transparent hover:text-ink hover:border-gold/40'
    }`;

  return (
    <header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-black/5"
      role="navigation"
      aria-label="Main"
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Logo + wordmark */}
        <Link
          href={createLocaleUrl('/dashboard', currentLocale)}
          className="flex items-center gap-3 shrink-0 group"
          aria-label="Go to Dashboard"
        >
          <Image
            src="/stars-logo.png"
            alt="Stars Logo"
            width={36}
            height={36}
            className="h-9 w-9 transition-transform group-hover:scale-105"
            priority
          />
          <span className="hidden sm:flex flex-col leading-none">
            <span className="text-[10px] tracking-[0.3em] uppercase text-slate-ardoise font-medium">
              Star Luxury Group
            </span>
            <span className="text-sm font-semibold tracking-wide text-ink mt-0.5">
              {tCommon('appName')}
            </span>
          </span>
        </Link>

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

          {isAdmin(session?.user?.email) && (
            <AdminDropdown currentLocale={currentLocale} />
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {session?.user ? (
            <div className="flex items-center gap-3">
              <Avatar
                name={session.user.name || session.user.email || 'User'}
                src={session.user.image}
              />
              <SignOutButton />
            </div>
          ) : (
            <div className="text-xs uppercase tracking-widest text-slate-ardoise">
              Not signed in
            </div>
          )}
        </div>
      </div>
      {/* Filet doré sous le header */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </header>
  );
}
