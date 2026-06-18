import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isAdmin } from '@/config/admins';
import Link from 'next/link';
import { AdminSidebar } from '@/components/nav/AdminSidebar';

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
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-3xl font-light tracking-tight text-ink mb-3">
          Access denied
        </h1>
        <p className="text-slate-ardoise max-w-md mx-auto">
          You are signed in as{' '}
          <span className="font-medium text-ink">{session.user.email}</span>,
          but this account is not on the administrators list.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href={`/${locale}`}
            className="px-4 py-2 text-sm border border-black/10 rounded-md text-slate-ardoise hover:text-ink hover:bg-cream transition-colors"
          >
            Back to home
          </Link>
          <Link
            href={`/api/auth/signout?callbackUrl=${encodeURIComponent(currentPath)}`}
            className="px-4 py-2 text-sm bg-ink text-white rounded-md hover:bg-ink/90 transition-colors"
          >
            Sign in as a different account
          </Link>
        </div>
      </div>
    );
  }

  // Back office = layout sidebar (charte SLG, aligné sur le portail RH).
  // Sidebar à gauche (nav admin) + contenu de la page à droite. Sur mobile,
  // la sidebar passe en barre horizontale au-dessus du contenu.
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
      <AdminSidebar />
      <main id="main" className="min-w-0 flex-1 px-4 sm:px-6 py-6 lg:py-8">
        {children}
      </main>
    </div>
  );
}
