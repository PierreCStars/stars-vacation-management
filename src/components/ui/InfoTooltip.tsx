/**
 * Tooltip built on @radix-ui/react-tooltip.
 *
 * Why Radix and not a custom implementation:
 *   - It renders the popover in a portal, so it escapes parent overflow:hidden
 *     / overflow-x-auto contexts (e.g. the analytics employee table) that would
 *     otherwise clip the tooltip.
 *   - Built-in viewport-aware positioning, keyboard accessibility, touch support.
 *
 * API: `<InfoTooltip content={<>...</>}>{optionalTrigger}</InfoTooltip>`
 *   - default trigger is a small "ⓘ" glyph
 *   - hover or focus to reveal
 */
'use client';

import { ReactNode } from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

type Props = {
  /** Tooltip content. Plain text or rich ReactNode. */
  content: ReactNode;
  /** Trigger element. Defaults to a small info glyph. */
  children?: ReactNode;
  /** Max width of the bubble in px. Defaults to 280. */
  width?: number;
  /** Anchor side. Defaults to 'top'. */
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

export function InfoTooltip({
  content,
  children,
  width = 280,
  side = 'top',
  className,
}: Props) {
  return (
    <RadixTooltip.Provider delayDuration={150}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>
          <span
            className={cn(
              'relative inline-flex items-center cursor-help focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded',
              className,
            )}
            tabIndex={0}
          >
            {children ?? <InfoGlyph />}
          </span>
        </RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            sideOffset={6}
            collisionPadding={8}
            className="z-[60] rounded-md border border-black/10 bg-white px-3 py-2 text-xs leading-relaxed text-ink shadow-card"
            style={{ maxWidth: width }}
          >
            {content}
            <RadixTooltip.Arrow className="fill-white" width={10} height={6} />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
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
      className="text-slate-ardoise/60 hover:text-ink transition-colors pointer-events-none"
      aria-hidden="true"
    >
      <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1" />
      <path d="M7 6v3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="7" cy="4.2" r="0.6" fill="currentColor" />
    </svg>
  );
}
