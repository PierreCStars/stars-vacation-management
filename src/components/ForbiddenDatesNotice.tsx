// components/ForbiddenDatesNotice.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NoticeModal from './NoticeModal';

/**
 * Client component that shows the forbidden dates notice modal once per session
 * after user sign-in. Uses sessionStorage to track if the notice has been shown.
 */
export default function ForbiddenDatesNotice() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  // Extract locale from pathname (e.g., /en/dashboard -> 'en')
  const locale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    // Only show if authenticated and session is loaded
    if (status === 'loading') return;
    if (status === 'unauthenticated') return;

    // Check if user is signed in
    const isSignedIn = !!session?.user?.email;
    if (!isSignedIn) return;

    // Check if we've already shown this notice in this session
    if (typeof window !== 'undefined') {
      const key = 'tm-gp-notice-shown';
      const hasShown = sessionStorage.getItem(key);
      
      if (!hasShown) {
        setShow(true);
        sessionStorage.setItem(key, '1');
      }
    }
  }, [session, status]);

  return <NoticeModal open={show} onClose={() => setShow(false)} locale={locale} />;
}







