'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { LanguageSwitcher } from './nav/LanguageSwitcher';
import { SignOutButton } from './SignOutButton';
import Avatar from './Avatar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { createLocaleUrl } from '@/i18n/routing';

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { tNav } = useLanguage();

  // Extract current locale from pathname
  const currentLocale = pathname?.split('/')[1] || 'en';

  // Helper function to check if a link is active
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === `/${currentLocale}`;
    }
    return pathname === `/${currentLocale}${href}`;
  };

  // Helper function to create locale-aware links
  const createLocaleLink = (href: string) => `/${currentLocale}${href}`;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and main nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link href={createLocaleLink('/')} className="flex items-center">
                <Image
                  src="/stars-logo.png"
                  alt="Stars Logo"
                  width={40}
                  height={40}
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Stars Vacation Management
                </span>
              </Link>
            </div>
            
            {/* Main navigation links */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <Link
                href={createLocaleLink('/dashboard')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tNav('dashboard')}
              </Link>
              
              <Link
                href={createLocaleLink('/vacation-request')}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/vacation-request')
                    ? 'border-indigo-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tNav('vacationRequests')}
              </Link>
              
              {(session?.user?.email === 'johnny@stars.mc' || 
                session?.user?.email === 'pierre@stars.mc' || 
                session?.user?.email === 'daniel@stars.mc' || 
                session?.user?.email === 'compta@stars.mc') && (
                <>
                  <Link
                    href={createLocaleLink('/admin/vacation-requests')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/admin/vacation-requests')
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tNav('admin')}
                  </Link>
                  
                  <Link
                    href={createLocaleLink('/admin/analytics')}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      isActive('/admin/analytics')
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {tNav('analytics')}
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Right side - Language switcher, user menu, etc. */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {session?.user ? (
              <div className="flex items-center space-x-3">
                <Avatar 
                  name={session.user.name || session.user.email || 'User'} 
                  src={session.user.image} 
                />
                <SignOutButton />
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">Not signed in</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
