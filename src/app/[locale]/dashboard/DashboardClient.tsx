'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import { VacationRequest } from '@/types/vacation';
import { createLocaleUrl } from '@/i18n/routing';
import { isAdmin } from '@/config/admins';

export default function DashboardClient() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const tCommon = useTranslations('common');
  const tNav = useTranslations('nav');
  const tVacations = useTranslations('vacations');
  const tCalendar = useTranslations('calendar');
  const tDashboard = useTranslations('dashboard');

  const isAdminUser = isAdmin(session?.user?.email);
  const currentLocale = pathname?.split('/')[1] || 'en';
  const firstName = session?.user?.name?.split(' ')[0];

  useEffect(() => {
    const fetchVacationRequests = async () => {
      try {
        const response = await fetch('/api/vacation-requests');
        if (response.ok) {
          const data = await response.json();
          setVacationRequests(data);
        } else {
          console.error('Failed to fetch vacation requests:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching vacation requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVacationRequests();
  }, []);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Hero header */}
        <header className="mb-12 text-center">
          <Link
            href={createLocaleUrl('/dashboard', currentLocale)}
            className="inline-block mb-6 transition-transform hover:scale-105"
            aria-label="Stars"
          >
            <Image
              src="/stars-logo.png"
              alt="Stars"
              width={88}
              height={88}
              priority
            />
          </Link>
          <p className="eyebrow mb-3">Star Luxury Group</p>
          <h1 className="!font-light tracking-tight">
            {tCommon('dashboard')}
          </h1>
          <div className="mt-4 flex justify-center">
            <span className="filet-gold" />
          </div>
          <p className="mt-6 text-base text-slate-ardoise/90 max-w-xl mx-auto leading-relaxed">
            {firstName ? `${firstName} — ` : ''}{tCommon('welcome')}
          </p>
        </header>

        {/* Global vacation calendar */}
        <section className="card mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="!text-xl !font-semibold">
              {tCalendar('globalVacationCompanyCalendar')}
            </h2>
            <span className="hidden sm:block filet-gold !w-12" />
          </div>
          {loading ? (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-3" />
              <p className="text-sm text-slate-ardoise">
                {tCalendar('loadingVacationCalendar')}
              </p>
            </div>
          ) : (
            <UnifiedVacationCalendar
              vacationRequests={vacationRequests.filter(r => r.status?.toLowerCase() === 'approved')}
            />
          )}
        </section>

        {/* Action cards */}
        <section
          className={`grid gap-6 ${isAdminUser ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}
        >
          {/* Request vacation */}
          <article className="card card-hover flex flex-col">
            <p className="eyebrow mb-3">For you</p>
            <h3 className="!text-xl !font-semibold mb-3">
              {tVacations('request')}
            </h3>
            <p className="text-sm text-slate-ardoise/90 mb-6 leading-relaxed flex-1">
              Submit a new vacation request for approval.
            </p>

            {/* Notice */}
            <div className="bg-gold/8 border border-gold/30 rounded-lg p-4 mb-6">
              <p className="text-xs leading-relaxed text-ink/80">
                {tDashboard('notice')}
              </p>
            </div>

            <Link
              href={createLocaleUrl('/vacation-request', currentLocale)}
              className="btn-primary self-start"
            >
              {tCommon('submit')}
            </Link>
          </article>

          {/* Administration */}
          {isAdminUser && (
            <article className="card card-hover flex flex-col">
              <p className="eyebrow mb-3">Admin</p>
              <h3 className="!text-xl !font-semibold mb-3">
                {tNav('administration')}
              </h3>
              <p className="text-sm text-slate-ardoise/90 mb-6 leading-relaxed flex-1">
                Manage and review vacation requests.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={createLocaleUrl('/admin/vacation-requests', currentLocale)}
                  className="btn-primary"
                >
                  {tNav('vacationRequests')}
                </Link>
                <Link
                  href={createLocaleUrl('/admin/analytics', currentLocale)}
                  className="btn-secondary"
                >
                  {tNav('analytics')}
                </Link>
              </div>
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
