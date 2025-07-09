import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import type { ReactNode } from 'react';
import PersistentCalendar from '@/components/PersistentCalendar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stars Vacation Management',
  description: 'Vacation request management system for Stars Group',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LanguageProvider>
        {/* PersistentCalendar will now be rendered in each page after main content */}
      </body>
    </html>
  );
}
