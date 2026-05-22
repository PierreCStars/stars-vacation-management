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
    <main className="min-h-[calc(100dvh-4rem)] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mx-auto mb-6 h-16 w-16 relative">
            <Image
              src="/stars-logo.png"
              alt="Stars"
              fill
              className="object-contain"
              priority
            />
          </div>

          <p className="eyebrow mb-3">Star Luxury Group</p>
          <h1 className="!text-2xl !font-light tracking-tight">
            Stars Vacation Management
          </h1>
          <div className="mt-4 mb-6 flex justify-center">
            <span className="filet-gold" />
          </div>

          <p className="text-sm text-slate-ardoise/90 mb-8">
            Sign in with your <span className="font-medium text-ink">@stars.mc</span> account
          </p>

          {!showDevLogin ? (
            <div className="space-y-3">
              <button
                onClick={() => signIn("google", { callbackUrl: `/${locale}/dashboard` })}
                className="btn-primary w-full"
              >
                Continue with Google
              </button>
              <button
                onClick={() => setShowDevLogin(true)}
                className="btn-ghost w-full !text-xs !tracking-widest !uppercase"
              >
                Development login
              </button>
            </div>
          ) : (
            <form onSubmit={handleDevLogin} className="space-y-4 text-left">
              <div>
                <label className="eyebrow block mb-2" htmlFor="dev-email">Email</label>
                <input
                  id="dev-email"
                  type="email"
                  placeholder="your.email@stars.mc"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="eyebrow block mb-2" htmlFor="dev-password">Password</label>
                <input
                  id="dev-password"
                  type="password"
                  placeholder="Any password (dev mode)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              {error && (
                <div className="text-sm text-[#8E2630] bg-[#FBECEE] border border-[#8E2630]/20 rounded-md px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1"
                >
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDevLogin(false)}
                  className="btn-secondary flex-1"
                >
                  Back
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-slate-ardoise/70">
            Members of stars.mc only
          </p>
        </div>
      </div>
    </main>
  );
}
