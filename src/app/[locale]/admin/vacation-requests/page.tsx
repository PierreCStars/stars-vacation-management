import { unstable_noStore } from 'next/cache';
import AdminPendingRequestsV2 from '@/components/admin/AdminPendingRequestsV2';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminVacationRequestsPage({ params }: { params: { locale: string } }) {
  unstable_noStore(); // Ensure no caching

  return (
    <div>
      <AdminPendingRequestsV2 />
    </div>
  );
}