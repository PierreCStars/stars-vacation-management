'use client';

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/90 border border-white/30 hover:bg-white hover:text-ink hover:border-white transition-colors"
    >
      Sign Out
    </button>
  );
}