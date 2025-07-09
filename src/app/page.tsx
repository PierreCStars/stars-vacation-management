import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import SignInButton from '@/components/SignInButton';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  console.log('Login page - Session:', session);
  console.log('Login page - Session exists:', !!session);
  console.log('Login page - User email:', session?.user?.email);

  // If user is already authenticated, redirect to dashboard
  if (session) {
    redirect('/dashboard');
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
          <div className="mb-6">
            <Image 
              src="/stars-logo.png" 
              alt="Stars Logo" 
              width={180}
              height={180}
              style={{ maxWidth: 180, maxHeight: 180, width: 'auto', height: 'auto', display: 'block', margin: '0 auto' }}
              className="mb-4 drop-shadow-lg"
              priority 
            />
          </div>
          <h1 
            className="text-5xl font-bold tracking-tight mb-4 text-gray-900"
            style={{ 
              fontSize: '3rem', 
              fontWeight: '700', 
              color: '#111827', 
              letterSpacing: '-0.025em', 
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Stars Vacation Management
          </h1>
        </div>

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
              className="text-gray-600 mb-6"
              style={{ 
                color: '#4b5563', 
                marginBottom: '1.5rem',
                lineHeight: 1.6
              }}
            >
              Please sign in with your Stars MC account to access the vacation management system.
            </p>
          </div>
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
