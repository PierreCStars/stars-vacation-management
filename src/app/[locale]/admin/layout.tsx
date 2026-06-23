import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import Link from 'next/link';

// The admin layout is per-request: it reads the session cookie + the
// x-pathname header injected by middleware. Static rendering would defeat
// both, so we force dynamic.
export const dynamic = 'force-dynamic';

/**
 * Server-side guard for every /admin/** route.
 *
 * - No session  → redirect to NextAuth sign-in with a callbackUrl that points
 *                 back to the exact admin page the user was trying to reach.
 * - Signed in, not on the admin list → render a clean "Access denied" page.
 * - Signed in admin → render the requested page.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const h = await headers();
  const currentPath = h.get('x-pathname') || `/${locale}/admin/vacation-requests`;

  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  if (!isAdmin(session.user.email)) {
    const t = await getTranslations({ locale, namespace: 'admin' });
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-3xl font-light tracking-tight text-ink mb-3">
          {t('accessDenied.title')}
        </h1>
        <p className="text-slate-ardoise max-w-md mx-auto">
          {t('accessDenied.signedInAs')}{' '}
          <span className="font-medium text-ink">{session.user.email}</span>
          {t('accessDenied.notAdmin')}
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="px-4 py-2 text-sm border border-black/10 rounded-md text-slate-ardoise hover:text-ink hover:bg-cream transition-colors"
          >
            {t('accessDenied.backHome')}
          </Link>
          <Link
            href={`/api/auth/signout?callbackUrl=${encodeURIComponent(currentPath)}`}
            className="px-4 py-2 text-sm bg-ink text-white rounded-md hover:bg-ink/90 transition-colors"
          >
            {t('accessDenied.switchAccount')}
          </Link>
        </div>
      </div>
    );
  }

  // Back office en pleine largeur (la nav admin vit désormais dans la sidebar
  // globale de l'AppShell). On élargit la zone utile pour que les tableaux ne
  // débordent plus ; pas de max-width, juste un padding responsive.
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      {children}
    </div>
  );
}
