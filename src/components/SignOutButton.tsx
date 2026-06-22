'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export function SignOutButton() {
  const t = useTranslations('common');
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="inline-flex min-h-[40px] items-center justify-center rounded-sm border border-ink-900/20 px-3 py-2 text-xs font-medium uppercase tracking-widest text-ink-700 transition-colors hover:bg-ink-900/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400"
    >
      {t('logout')}
    </button>
  );
}