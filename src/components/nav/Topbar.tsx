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

export function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const currentLocale = pathname?.split('/')[1] || 'en';

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/') || false;

  return (
    <header
      className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b shadow-sm"
      role="navigation"
      aria-label="Main"
    >
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link 
          href={createLocaleUrl('/dashboard', currentLocale)} 
          className="flex items-center gap-3 shrink-0" 
          aria-label="Go to Dashboard"
        >
          <Image
            src="/stars-logo.png"
            alt="Stars Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="hidden sm:inline font-semibold text-gray-900 text-lg">
            {tCommon('appName')}
          </span>
        </Link>

        {/* Main navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href={createLocaleUrl('/dashboard', currentLocale)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tNav('dashboard')}
          </Link>
          
          <Link
            href={createLocaleUrl('/vacation-request', currentLocale)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive('/vacation-request')
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {tNav('vacationRequests')}
          </Link>
          
          {isAdmin(session?.user?.email) && (
            <>
              <Link
                href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/vacation-requests')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tNav('admin')}
              </Link>
              
              <Link
                href={createLocaleUrl('/admin/analytics', currentLocale)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/analytics')
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tNav('analytics')}
              </Link>
            </>
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
            <div className="text-sm text-gray-500">
              Not signed in
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
