import { redirect } from 'next/navigation';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const safeLocale = ['en','fr','it'].includes(locale) ? locale : 'en';
  redirect(`/${safeLocale}/dashboard`);
}
