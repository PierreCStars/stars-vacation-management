'use client';
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [showDevLogin, setShowDevLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        username: email,
        password: password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please use a @stars.mc email address.');
      } else {
        window.location.href = `/${locale}/admin/vacation-requests`;
      }
    } catch (err) {
      setError('An error occurred during sign-in.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <main className="min-h-dvh flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow p-8 text-center">
        <div className="mx-auto mb-6 h-14 w-14 relative">
          {/* Using the existing stars logo */}
          <Image src="/stars-logo.png" alt="Stars" fill className="object-contain" priority />
        </div>
        <h1 className="text-xl font-semibold">Stars Vacation Management</h1>
        <p className="mt-2 text-sm text-gray-600">Connect with your @stars.mc account</p>
        
        {!showDevLogin ? (
          <>
            <button
              onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
              className="mt-6 w-full rounded-xl border px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              Continue with Google
            </button>
            <button
              onClick={() => setShowDevLogin(true)}
              className="mt-3 w-full text-sm text-blue-600 hover:text-blue-800"
            >
              Development Login (if Google OAuth fails)
            </button>
          </>
        ) : (
          <form onSubmit={handleDevLogin} className="mt-6 space-y-4">
            <div>
              <input
                type="email"
                placeholder="your.email@stars.mc"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Any password (dev mode)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600">{error}</div>
            )}
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <button
                type="button"
                onClick={() => setShowDevLogin(false)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
            </div>
          </form>
        )}
        
        <p className="mt-3 text-xs text-gray-500">Only members of stars.mc are allowed.</p>
      </div>
    </main>
  );
}
