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
    <div className="slg-modal-backdrop">
      <div className="slg-modal max-w-lg">
        <h2 className="mb-3 text-xl font-semibold">Information</h2>
        <p className="mb-6 leading-relaxed text-slate-ardoise">{text}</p>
        <div className="flex justify-end">
          <button
            className="btn-secondary"
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









