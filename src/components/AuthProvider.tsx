'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect } from 'react';
import { initializeFirebaseAuth } from '@/lib/firebase';

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Firebase authentication when the app loads
    initializeFirebaseAuth().catch(console.error);
  }, []);

  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  );
} 