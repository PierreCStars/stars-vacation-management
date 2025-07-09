import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import VacationRequestFormClientWrapper from '@/components/VacationRequestFormClientWrapper';
import GoogleCalendar from '@/components/GoogleCalendar';

export default async function VacationRequestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/vacation-request');
  }

  const firstName = session.user.name?.split(' ')[0] || 'User';

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
        {/* Header Section */}
        <div 
          className="text-center mb-8"
          style={{ textAlign: 'center', marginBottom: '2rem' }}
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
            Vacation Request
          </h1>
          <p 
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            style={{ 
              fontSize: '1.25rem', 
              color: '#4b5563', 
              marginBottom: '2rem',
              maxWidth: '42rem',
              margin: '0 auto 2rem auto',
              lineHeight: 1.6
            }}
          >
            Submit your vacation request and check the team calendar
          </p>
        </div>

        <div 
          className="space-y-6 max-w-3xl mx-auto"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            maxWidth: '48rem', 
            margin: '0 auto' 
          }}
        >
          {/* User Info Card */}
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
                  Welcome, {firstName}!
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
              <Link 
                href="/"
                style={{ 
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s',
                  display: 'inline-block'
                }}
                className="hover:bg-gray-100"
              >
                ← Back to Dashboard
              </Link>
              <SignOutButton />
            </div>
          </div>
          
          {/* Vacation Request Form Card */}
          <div 
            className="card"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <VacationRequestFormClientWrapper />
          </div>

          {/* Google Calendar Card */}
          <div 
            className="card"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2.5rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <GoogleCalendar 
              calendarId="c_e98f5350bf743174f87e1a786038cb9d103c306b7246c6200684f81c37a6a764@group.calendar.google.com"
              height="400px"
              title="Team Vacation Calendar"
              userEmail={session.user.email}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 