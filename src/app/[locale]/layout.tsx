import { setRequestLocale } from 'next-intl/server';
import IntlProvider from '../../i18n/intl-provider'; // keep relative path
import { AppShell } from '../../components/nav/AppShell';

export default async function LocaleLayout({
  children,
  params
}: any) {
  const { locale } = await params;
  const safeLocale = ['en','fr','it'].includes(locale) ? locale : 'en';
  setRequestLocale(safeLocale);

  // Load messages for the locale
  let messages;
  try {
    const { messages: allMessages } = await import('@/locales');
    messages = allMessages[safeLocale as keyof typeof allMessages];
  } catch (error) {
    console.warn('Failed to load messages for locale %s:', safeLocale, error);
    messages = {};
  }

  return (
    <IntlProvider messages={messages} locale={safeLocale}>
      <AppShell>{children}</AppShell>
    </IntlProvider>
  );
}
