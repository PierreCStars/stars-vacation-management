import { setRequestLocale } from 'next-intl/server';
import IntlProvider from '../../i18n/intl-provider'; // keep relative path
import { Topbar } from '../../components/nav/Topbar';
import { Footer } from '../../components/nav/Footer';
import ForbiddenDatesNotice from '../../components/ForbiddenDatesNotice';

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
    console.warn(`Failed to load messages for locale ${safeLocale}:`, error);
    messages = {};
  }

  return (
    <IntlProvider messages={messages} locale={safeLocale}>
      <div className="min-h-screen flex flex-col bg-cream-50">
        <Topbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <ForbiddenDatesNotice />
      </div>
    </IntlProvider>
  );
}
