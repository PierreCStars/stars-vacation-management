'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import LanguageSelector from './LanguageSelector';
import { SignOutButton } from './SignOutButton';
import Avatar from './Avatar';

export default function Navigation() {
  const { data: session } = useSession();
  
  // Check if user has admin access
  const isAdmin = session?.user?.email === 'johnny@stars.mc' || 
                  session?.user?.email === 'daniel@stars.mc' || 
                  session?.user?.email === 'pierre@stars.mc' || 
                  session?.user?.email === 'compta@stars.mc';

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand - Centered */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image 
                src="/stars-logo.png" 
                alt="Stars Logo" 
                width={48}
                height={48}
                style={{ height: 'auto' }}
                className="rounded-lg"

              />
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Stars Vacation
              </span>
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard"
              className="text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Dashboard
            </Link>
            
            <Link 
              href="/vacation-request"
              className="text-gray-700 hover:text-brand-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
            >
              Request Vacation
            </Link>

            {isAdmin && (
              <Link 
                href="/admin/vacation-requests"
                className="text-gray-700 hover:text-purple-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Management
              </Link>
            )}
          </div>

          {/* Right side - User info and controls */}
          <div className="flex items-center space-x-4">
            <LanguageSelector />
            
            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <Avatar 
                name={session?.user?.name || session?.user?.email || "User"}
                src={session?.user?.image}
                size={36}
                className="border-2 border-brand-200"
                alt="Profile"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{session?.user?.name}</p>
                <p className="text-xs text-gray-500">{session?.user?.email}</p>
              </div>
            </div>

            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-100">
          <Link 
            href="/dashboard"
            className="text-gray-700 hover:text-brand-600 block px-3 py-2 rounded-lg text-base font-medium"
          >
            Dashboard
          </Link>
          
          <Link 
            href="/vacation-request"
            className="text-gray-700 hover:text-brand-600 block px-3 py-2 rounded-lg text-base font-medium"
          >
            Request Vacation
          </Link>

          {isAdmin && (
            <Link 
              href="/admin/vacation-requests"
              className="text-gray-700 hover:text-purple-600 block px-3 py-2 rounded-lg text-base font-medium"
            >
              Management
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
