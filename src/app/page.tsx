import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { SignOutButton } from '@/components/SignOutButton';
import SignInButton from '@/components/SignInButton';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  console.log('Home page - Session:', session);
  console.log('Home page - Session exists:', !!session);
  console.log('Home page - User email:', session?.user?.email);

  // Check if user has admin access
  const isAdmin = session?.user?.email === 'johnny@stars.mc' || session?.user?.email === 'daniel@stars.mc' || session?.user?.email === 'pierre@stars.mc';

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
          className="text-center mb-12"
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <div className="mb-8">
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={220} 
              height={155} 
              className="mx-auto mb-6 drop-shadow-lg" 
              priority 
            />
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
            Stars Vacation Management
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
            Streamline your vacation requests with our modern, secure platform
          </p>
        </div>

        {!session ? (
          <div 
            className="card max-w-md mx-auto"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '1rem', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
              padding: '2.5rem', 
              maxWidth: '28rem', 
              margin: '0 auto',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="text-center mb-6">
              <h2 
                className="text-2xl font-semibold mb-4 text-gray-900"
                style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '600', 
                  color: '#111827', 
                  marginBottom: '1rem' 
                }}
              >
                Welcome to Stars
              </h2>
              <p 
                className="text-gray-600 mb-8"
                style={{ 
                  color: '#4b5563', 
                  marginBottom: '2rem',
                  lineHeight: 1.6
                }}
              >
                Please sign in with your Stars MC account to access the vacation management system.
              </p>
            </div>
            <SignInButton />
          </div>
        ) : (
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
                    Welcome back, {session.user.name}!
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
                    Request Vacation
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
                  Submit Request
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
                      className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ 
                        width: '4rem', 
                        height: '4rem', 
                        backgroundColor: '#dcfce7', 
                        borderRadius: '50%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1rem auto' 
                      }}
                    >
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      Administration
                    </h3>
                    <p 
                      className="text-gray-600 mb-6"
                      style={{ 
                        color: '#4b5563', 
                        marginBottom: '1.5rem',
                        lineHeight: 1.6
                      }}
                    >
                      Review and manage vacation requests
                    </p>
                  </div>
                  <Link 
                    href="/admin/vacation-requests"
                    className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200"
                    style={{ 
                      display: 'inline-block',
                      backgroundColor: '#16a34a',
                      color: 'white',
                      padding: '0.75rem 2rem',
                      borderRadius: '0.5rem',
                      fontWeight: '600',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    Access Admin
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
