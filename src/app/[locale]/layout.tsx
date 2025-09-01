import { setRequestLocale } from 'next-intl/server';
import IntlProvider from '../../i18n/intl-provider'; // keep relative path
import { Topbar } from '../../components/nav/Topbar';
import { AdminSidebar } from '../../components/nav/AdminSidebar';

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
    const { loadMessages } = await import('@/locales');
    const allMessages = await loadMessages();
    messages = allMessages[safeLocale as keyof typeof allMessages];
  } catch (error) {
    console.warn(`Failed to load messages for locale ${safeLocale}:`, error);
    messages = {};
  }

  return (
    <IntlProvider messages={messages} locale={safeLocale}>
      <Topbar />
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </IntlProvider>
  );
}
