import { redirect } from 'next/navigation';

// Admin page that redirects to vacation requests management
export default async function AdminPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = ['en', 'fr', 'it'].includes(locale) ? locale : 'en';
  
  // Redirect to the locale-aware vacation requests admin page
  redirect(`/${safeLocale}/admin/vacation-requests`);
}
 