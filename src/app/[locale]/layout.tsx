import { setRequestLocale } from 'next-intl/server';
import IntlProvider from '../../i18n/intl-provider'; // keep relative path
import { Topbar } from '../../components/nav/Topbar';
import { AdminSidebar } from '../../components/nav/AdminSidebar';
import DebugBanner from '../../components/DebugBanner';

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
      <div className="min-h-screen bg-gray-50">
        <DebugBanner />
        <Topbar />
        <div className="flex">
          <AdminSidebar />
          <main className="flex-1 min-h-screen">
            {children}
          </main>
        </div>
      </div>
    </IntlProvider>
  );
}
