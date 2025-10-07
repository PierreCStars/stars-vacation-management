'use client';
import React from 'react';
import { NextIntlClientProvider } from 'next-intl';

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
    <NextIntlClientProvider 
      messages={messages} 
      locale={locale}
      timeZone="Europe/Paris"
    >
      {children}
    </NextIntlClientProvider>
  );
}
