'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignOutButton } from '@/components/SignOutButton';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSelector from '@/components/LanguageSelector';
import PersistentCalendar from '@/components/PersistentCalendar';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user?.email) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <main 
        className="min-h-screen flex flex-col items-center justify-center py-12"
        style={{ 
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '3rem',
          paddingBottom: '3rem'
        }}
      >
        <div 
          className="w-full max-w-4xl"
          style={{ 
            width: '100%', 
            maxWidth: '896px', 
            paddingLeft: '1.5rem', 
            paddingRight: '1.5rem' 
          }}
        >
          <div 
            className="text-center mb-8"
            style={{ textAlign: 'center', marginBottom: '2rem' }}
          >
            <Link href="/dashboard">
              <Image 
                src="/stars-logo.png" 
                alt="Stars Logo" 
                width={180}
                height={180}
                style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
                className="mb-6 drop-shadow-lg"
                priority 
              />
            </Link>
            <h1 
              className="text-5xl font-bold tracking-tight mb-6 text-gray-900"
              style={{ 
                fontSize: '3rem', 
                fontWeight: '700', 
                color: '#111827', 
                letterSpacing: '-0.025em', 
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {t.dashboard.title}
            </h1>
          </div>
          <div 
            className="card text-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div style={{ width: 64, height: 64, border: '4px solid #f3f4f6', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px auto' }}></div>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: '#111827', marginBottom: 8 }}>
              {t.common.loading}
            </h2>
            <p style={{ color: '#6b7280' }}>Please wait while we load your dashboard.</p>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    );
  }

  if (!session?.user) {
    return null;
  }

  // Check if user has admin access
  const isAdmin = session.user.email === 'johnny@stars.mc' || session.user.email === 'daniel@stars.mc' || session.user.email === 'pierre@stars.mc' || session.user.email === 'compta@stars.mc';

  return (
    <main 
      className="min-h-screen flex flex-col items-center justify-start py-12"
      style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '3rem',
        paddingBottom: '3rem'
      }}
    >
      <div 
        className="w-full max-w-5xl"
        style={{ 
          width: '100%', 
          maxWidth: '1280px', 
          paddingLeft: '1.5rem', 
          paddingRight: '1.5rem' 
        }}
      >
        {/* Header with Language Selector */}
        <div 
          className="flex justify-between items-center mb-8"
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '2rem' 
          }}
        >
          <div></div> {/* Empty div for spacing */}
          <LanguageSelector />
        </div>

        <div 
          className="text-center mb-12"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div className="mb-8">
            <Link href="/dashboard">
              <Image 
                src="/stars-logo.png" 
                alt="Stars Logo" 
                width={180}
                height={180}
                style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto', cursor: 'pointer' }}
                className="mb-6 drop-shadow-lg"
                priority 
              />
            </Link>
          </div>
          <h1 
            className="text-5xl font-bold tracking-tight mb-6 text-gray-900"
            style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1.5rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {t.dashboard.title}
          </h1>

        </div>

        <div 
          className="space-y-8 max-w-4xl mx-auto"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2rem', 
            maxWidth: '64rem', 
            margin: '0 auto' 
          }}
        >
          <div 
            className="card text-center"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center mb-4">
              {session.user.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={60} 
                  height={60} 
                  className="rounded-full mr-4 border-2 border-blue-200"
                />
              )}
              <div>
                <h2 
                  className="text-2xl font-semibold text-gray-900"
                  style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '600', 
                    color: '#111827' 
                  }}
                >
                  {t.dashboard.welcome}, {session.user.name}!
                </h2>
                <p 
                  className="text-gray-600"
                  style={{ 
                    color: '#4b5563',
                    fontSize: '1rem'
                  }}
                >
                  {session.user.email}
                </p>
              </div>
            </div>
            <SignOutButton />
          </div>
          
          <div 
            className="grid md:grid-cols-2 gap-6"
            style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Vacation Request Card */}
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
                  {t.dashboard.requestVacation}
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
                href="/vacation-request"
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
                {t.dashboard.submitRequest}
              </Link>
            </div>

            {/* Administration Card */}
            {isAdmin && (
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
                    {t.dashboard.administration}
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
                    href="/admin/vacation-requests"
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
                    Management & Analytics
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <PersistentCalendar />
    </main>
  );
} 