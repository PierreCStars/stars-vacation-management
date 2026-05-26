/**
 * Lightweight tooltip — appears on hover/focus, positioned above the trigger.
 * No portal, no library. Used for sprinkling contextual help on the analytics
 * page (KPI labels, signal badges, column headers, etc.).
 */
'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  /** Tooltip content. Plain text or rich ReactNode. */
  content: ReactNode;
  /** Trigger element. Defaults to a small info glyph. */
  children?: ReactNode;
  /** Max width of the bubble in px. Defaults to 280. */
  width?: number;
  /** Anchor side. Defaults to 'top'. */
  side?: 'top' | 'bottom';
  className?: string;
};

export function InfoTooltip({
  content,
  children,
  width = 280,
  side = 'top',
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className={cn('relative inline-flex items-center', className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span tabIndex={0} className="inline-flex cursor-help">
        {children ?? <InfoGlyph />}
      </span>
      {open && (
        <span
          role="tooltip"
          className={cn(
            'absolute left-1/2 z-50 -translate-x-1/2 whitespace-normal rounded-md border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed text-ink shadow-card',
            side === 'top' ? 'bottom-full mb-2' : 'top-full mt-2',
          )}
          style={{ width }}
        >
          {content}
        </span>
      )}
    </span>
  );
}

function InfoGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-slate-ardoise/60 hover:text-ink transition-colors"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
      <path d="M7 6v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="4.2" r="0.6" fill="currentColor" />
    </svg>
  );
}
