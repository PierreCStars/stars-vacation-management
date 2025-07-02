import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import VacationRequestFormClientWrapper from '@/components/VacationRequestFormClientWrapper';

export default async function VacationRequestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/vacation-request');
  }

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
        className="w-full max-w-5xl px-6"
        style={{ 
          width: '100%', 
          maxWidth: '1280px', 
          paddingLeft: '1.5rem', 
          paddingRight: '1.5rem' 
        }}
      >
        <div 
          className="text-center mb-8"
          style={{ textAlign: 'center', marginBottom: '2rem' }}
        >
          <div className="mb-6">
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={180} 
              height={127} 
              className="mx-auto mb-4 drop-shadow-lg" 
              priority 
            />
          </div>
          <h1 
            className="text-4xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '2.25rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Submit Vacation Request
          </h1>
        </div>

        <div 
          className="space-y-6 max-w-4xl mx-auto"
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.5rem', 
            maxWidth: '64rem', 
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
              padding: '1.5rem',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex items-center justify-center mb-3">
              {session.user.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={50} 
                  height={50} 
                  className="rounded-full mr-3 border-2 border-blue-200"
                />
              )}
              <div>
                <h2 
                  className="text-xl font-semibold text-gray-900"
                  style={{ 
                    fontSize: '1.25rem', 
                    fontWeight: '600', 
                    color: '#111827' 
                  }}
                >
                  {session.user.name}
                </h2>
                <p 
                  className="text-gray-600"
                  style={{ 
                    color: '#4b5563',
                    fontSize: '0.875rem'
                  }}
                >
                  {session.user.email}
                </p>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <Link 
                href="/"
                className="text-blue-600 hover:underline text-sm"
                style={{ 
                  color: '#2563eb',
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                ← Back to Home
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
            <h3 
              className="text-2xl font-semibold mb-6 text-gray-900 text-center"
              style={{ 
                fontSize: '1.5rem', 
                fontWeight: '600', 
                color: '#111827', 
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}
            >
              Vacation Request Form
            </h3>
            <VacationRequestFormClientWrapper />
          </div>
        </div>
      </div>
    </main>
  );
} 