'use client';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';

export default function IntlProvider({ 
  children, 
  messages,
  locale = 'en'
}: { 
  children: React.ReactNode;
  messages: Record<string, unknown>;
  locale: string;
}) {
  return (
    <SessionProvider>
      <NextIntlClientProvider 
        messages={messages} 
        locale={locale}
        timeZone="Europe/Paris"
      >
        {children}
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
