'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NoticeModal from './NoticeModal';

type Lang = 'fr' | 'en' | 'it';
type ActiveNotice = { id: string; message: Record<Lang, string> };

/** Affiche, une fois par session, les messages des périodes actives (réglées en admin). */
export default function ForbiddenDatesNotice() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [messages, setMessages] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  const seg = pathname?.split('/')[1];
  const locale: Lang = seg === 'fr' || seg === 'it' ? seg : 'en';

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) return;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem('forbidden-notice-shown')) return;

    let cancelled = false;
    fetch('/api/forbidden-notice')
      .then(r => r.ok ? r.json() : { active: [] })
      .then((data: { active: ActiveNotice[] }) => {
        if (cancelled) return;
        const msgs = (data.active ?? [])
          .map(a => a.message?.[locale] || a.message?.en)
          .filter((m): m is string => !!m);
        if (msgs.length > 0) {
          setMessages(msgs);
          setShow(true);
          sessionStorage.setItem('forbidden-notice-shown', '1');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session, status, locale]);

  return <NoticeModal open={show} messages={messages} onClose={() => setShow(false)} />;
}
