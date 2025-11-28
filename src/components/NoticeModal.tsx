// components/NoticeModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { resolveLocale, signInNotice } from '@/lib/forbiddenDates';

type Props = { open?: boolean; onClose?: () => void; locale?: string };

export default function NoticeModal({ open, onClose, locale }: Props) {
  const [isOpen, setIsOpen] = useState(!!open);
  useEffect(() => setIsOpen(!!open), [open]);

  const resolvedLocale = resolveLocale(locale);
  const text = signInNotice(resolvedLocale);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-xl font-semibold">Information</h2>
        <p className="mb-6 leading-relaxed">{text}</p>
        <div className="flex justify-end">
          <button
            className="rounded-xl px-4 py-2 shadow-sm ring-1 ring-black/10 hover:bg-gray-50"
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}









