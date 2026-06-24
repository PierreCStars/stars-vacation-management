import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Per-request: reads the session cookie, so it can't be statically rendered.
export const dynamic = 'force-dynamic';

/**
 * Server-side auth guard for the employee vacation-request form.
 *
 * The form lives on its own (cross-app) domain; arriving here from the HR
 * portal tile carries no session on this domain, so the user would fill the
 * form and only then hit a 401 on POST /api/vacation-requests ("Unauthorized").
 * We move the gate up front: no session → send to Google sign-in with a
 * callbackUrl back to the form. Any signed-in @stars.mc user may submit (the
 * NextAuth signIn allowlist already decides who can get a session).
 */
export default async function VacationRequestLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);
  const h = await headers();
  const currentPath = h.get('x-pathname') || `/${locale}/vacation-request`;

  if (!session?.user?.email) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(currentPath)}`);
  }

  return <>{children}</>;
}
