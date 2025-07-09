import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';
import SignInButton from '@/components/SignInButton';

export default async function SignIn({
  searchParams,
}: {
  searchParams: { callbackUrl?: string };
}) {
  const session = await getServerSession(authOptions);
  
  console.log('SignIn page - Session:', session);
  console.log('SignIn page - Session user:', session?.user);
  console.log('SignIn page - Session user email:', session?.user?.email);

  // Only redirect if we have a valid session with user data
  if (session?.user?.email) {
    console.log('Redirecting to callback URL or home - user is signed in');
    const callbackUrl = searchParams.callbackUrl || '/';
    redirect(callbackUrl);
  }

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
        className="w-full max-w-md"
        style={{ 
          width: '100%', 
          maxWidth: '28rem', 
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
              height={180}
              style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto' }}
              className="drop-shadow-lg"
              priority 
            />
          </div>
          <h1 
            className="text-3xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '1.875rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Sign In
          </h1>
          <p 
            className="text-lg text-gray-600"
            style={{ 
              fontSize: '1.125rem', 
              color: '#4b5563',
              lineHeight: 1.6
            }}
          >
            Access your Stars vacation management account
          </p>
        </div>

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
          <div className="text-center mb-6">
            <h2 
              className="text-xl font-semibold mb-4 text-gray-900"
              style={{ 
                fontSize: '1.25rem', 
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
          
          <SignInButton callbackUrl={searchParams.callbackUrl || '/'} />
          
          <div 
            className="mt-6 text-center"
            style={{ marginTop: '1.5rem', textAlign: 'center' }}
          >
            <Link 
              href="/"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              style={{ 
                color: '#2563eb', 
                fontSize: '0.875rem', 
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'color 0.2s ease-in-out'
              }}
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 