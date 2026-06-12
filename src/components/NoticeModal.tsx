'use client';
import { useEffect, useState } from 'react';

type Props = { open?: boolean; onClose?: () => void; messages?: string[] };

export default function NoticeModal({ open, onClose, messages = [] }: Props) {
  const [isOpen, setIsOpen] = useState(!!open);
  useEffect(() => setIsOpen(!!open), [open]);
  if (!isOpen || messages.length === 0) return null;

  return (
    <div className="slg-modal-backdrop">
      <div className="slg-modal max-w-lg">
        <h2 className="mb-3 text-xl font-semibold">Information</h2>
        <div className="mb-6 space-y-3">
          {messages.map((m, i) => (
            <p key={i} className="leading-relaxed text-slate-ardoise">{m}</p>
          ))}
        </div>
        <div className="flex justify-end">
          <button className="btn-secondary" onClick={() => { setIsOpen(false); onClose?.(); }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
