import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import IntlProvider from '../../i18n/intl-provider'; // keep relative path
import { AppShell } from '../../components/nav/AppShell';

// The app-wide auth gate below reads the session cookie → never static.
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params
}: any) {
  const { locale } = await params;
  const safeLocale = ['en','fr','it'].includes(locale) ? locale : 'en';
  setRequestLocale(safeLocale);

  // App-wide auth gate: nothing under /[locale] is visible without a session.
  // Exception: the /[locale]/auth/** sub-route (sign-in / error) — gating it
  // would loop. The NextAuth sign-in page itself lives under /api/auth, outside
  // this layout, so the redirect target is never gated.
  const h = await headers();
  const currentPath = h.get('x-pathname') || `/${safeLocale}`;
  const isAuthRoute = /^\/[^/]+\/auth(\/|$)/.test(currentPath);
  if (!isAuthRoute) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
    }
  }

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
