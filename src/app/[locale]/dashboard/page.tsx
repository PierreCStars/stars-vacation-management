'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import UnifiedVacationCalendar from '@/components/UnifiedVacationCalendar';
import { VacationRequest } from '@/types/vacation';
import { usePathname } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const pathname = usePathname();
  const [vacationRequests, setVacationRequests] = useState<VacationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Use next-intl translations
  const tDashboard = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  // Extract current locale from pathname
  const currentLocale = pathname?.split('/')[1] || 'en';

  // Helper function to create locale-aware links
  const createLocaleLink = (href: string) => `/${currentLocale}${href}`;

  useEffect(() => {
    fetchVacationRequests();
  }, []);

  const fetchVacationRequests = async () => {
    try {
      setLoading(true);
      console.log('Dashboard: Fetching vacation requests...');
      const response = await fetch('/api/vacation-requests');
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard: Vacation requests received:', data);
        setVacationRequests(data);
      } else {
        console.error('Dashboard: Failed to fetch vacation requests:', response.status);
        // Set empty array to allow calendar to render
        setVacationRequests([]);
      }
    } catch (error) {
      console.error('Dashboard: Error fetching vacation requests:', error);
      // Set empty array to allow calendar to render
      setVacationRequests([]);
    } finally {
      console.log('Dashboard: Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <main 
      className="min-h-screen"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh'
      }}
    >
      <div 
        className="w-full max-w-6xl mx-auto px-6 py-12"
        style={{ 
          width: '100%', 
          maxWidth: '1152px', 
          paddingLeft: '1.5rem', 
          paddingRight: '1.5rem',
          paddingTop: '3rem',
          paddingBottom: '3rem'
        }}
      >
        {/* Header */}
        <div 
          className="text-center mb-12"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <Link href={createLocaleLink('/dashboard')}>
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={120}
              height={120}
              style={{ maxWidth: 120, maxHeight: 120, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
              className="mb-6 drop-shadow-lg"
              priority 
            />
          </Link>
          <h1 
            className="text-4xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {tDashboard('title')}
          </h1>
          <p 
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            style={{ 
              fontSize: '1.125rem', 
              color: '#4b5563', 
              maxWidth: '672px', 
              margin: '0 auto',
              lineHeight: 1.6
            }}
          >
            {tDashboard('welcomeMessage')}
          </p>
        </div>
        
        {/* Vacation Calendar */}
        <div 
          className="card mb-12"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '1rem', 
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
            padding: '2rem',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '3rem'
          }}
        >
          <h2 
            className="text-2xl font-semibold text-gray-900 mb-6"
            style={{ 
              fontSize: '1.5rem', 
              fontWeight: '600', 
              color: '#111827', 
              marginBottom: '1.5rem' 
            }}
          >
            Global Vacation & Company Calendar
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vacation calendar...</p>
            </div>
          ) : (
            <UnifiedVacationCalendar
              vacationRequests={vacationRequests}
              className="w-full"
              showLegend={true}
              compact={false}
            />
          )}
        </div>
        
        <div 
          className="grid md:grid-cols-2 gap-6"
          style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Request Vacation Card */}
          <div 
            className="card text-center hover:shadow-xl transition-shadow duration-300"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ 
                  width: '4rem', 
                  height: '4rem', 
                  backgroundColor: '#dbeafe', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem auto' 
                }}
              >
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 
                className="text-2xl font-semibold mb-4 text-gray-900"
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem' 
                }}
              >
                {tDashboard('requestVacation')}
              </h3>
              <p 
                className="text-gray-600 mb-6"
                style={{ 
                  color: '#4b5563', 
                  marginBottom: '1.5rem',
                  lineHeight: 1.6
                }}
              >
                Submit a new vacation request for approval
              </p>
            </div>
            <Link 
              href={createLocaleLink('/vacation-request')}
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
              style={{ 
                display: 'inline-block',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'background-color 0.2s ease'
              }}
            >
              {tDashboard('submitRequest')}
            </Link>
          </div>

          {/* Administration Card */}
          <div 
            className="card text-center hover:shadow-xl transition-shadow duration-300"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              transition: 'box-shadow 0.3s ease'
            }}
          >
            <div className="mb-6">
              <div 
                className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ 
                  width: '4rem', 
                  height: '4rem', 
                  backgroundColor: '#f3e8ff', 
                  borderRadius: '50%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  margin: '0 auto 1rem auto' 
                }}
              >
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 
                className="text-2xl font-semibold mb-4 text-gray-900"
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem' 
                }}
              >
                {tDashboard('administration')}
              </h3>
              <p 
                className="text-gray-600 mb-6"
                style={{ 
                  color: '#4b5563', 
                  marginBottom: '1.5rem',
                  lineHeight: 1.6
                }}
              >
                Manage and review vacation requests
              </p>
            </div>
            <div className="space-y-3">
              <Link 
                href={createLocaleLink('/admin/vacation-requests')}
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors duration-200"
                style={{ 
                  display: 'inline-block',
                  backgroundColor: '#9333ea',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Vacation Management
              </Link>
              <Link 
                href={createLocaleLink('/admin/analytics')}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
                style={{ 
                  display: 'inline-block',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'background-color 0.2s ease'
                }}
              >
                Analytics Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 