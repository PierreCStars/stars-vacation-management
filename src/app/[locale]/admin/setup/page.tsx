import { unstable_noStore } from 'next/cache';
import AdminSetupClient from './AdminSetupClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminSetupPage({ params }: { params: { locale: string } }) {
  unstable_noStore(); // Ensure no caching

  return (
    <div>
      <AdminSetupClient />
    </div>
  );
}

