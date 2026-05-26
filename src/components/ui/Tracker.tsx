/**
 * Tracker — Tremor-style status grid.
 *
 * One small colored block per item (e.g. one per day). Hover reveals tooltip.
 * Useful for at-a-glance coverage: "which days does the team have someone off?".
 *
 * Pattern source: https://tremor.so/docs/visualizations/tracker
 * Re-implemented here because @tremor/react@3 still pins react@18.
 */
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type TrackerBlock = {
  /** Stable key (e.g. ISO date string). */
  key: string;
  /** Tooltip content. Short string is fine; ReactNode for richer. */
  tooltip?: React.ReactNode;
  /** Background color (hex / css var / Tailwind arbitrary). Defaults to cream. */
  color?: string;
  /** Optional click handler. */
  onClick?: () => void;
  /** Optional accessible label. Defaults to tooltip string if any. */
  ariaLabel?: string;
};

type TrackerProps = {
  data: TrackerBlock[];
  /** Block height in pixels. Defaults to 28. */
  blockHeight?: number;
  /** Gap between blocks in pixels. Defaults to 2. */
  gap?: number;
  className?: string;
};

/**
 * Render a row of small colored blocks, one per data item.
 * Tooltip is rendered on hover/focus via a small absolutely-positioned div.
 */
export function Tracker({
  data,
  blockHeight = 28,
  gap = 2,
  className,
}: TrackerProps) {
  return (
    <div
      className={cn(
        'flex w-full items-center',
        className,
      )}
      style={{ gap: `${gap}px` }}
      role="group"
      aria-label="Tracker"
    >
      {data.map((block) => (
        <TrackerCell
          key={block.key}
          block={block}
          height={blockHeight}
        />
      ))}
    </div>
  );
}

function TrackerCell({
  block,
  height,
}: {
  block: TrackerBlock;
  height: number;
}) {
  const [open, setOpen] = React.useState(false);
  const color = block.color ?? '#F5F2EC'; // cream default = "nothing happening"

  return (
    <div
      className="relative flex-1 min-w-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        tabIndex={block.tooltip ? 0 : -1}
        aria-label={block.ariaLabel ?? (typeof block.tooltip === 'string' ? block.tooltip : block.key)}
        onClick={block.onClick}
        className={cn(
          'w-full rounded-sm transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1',
          block.onClick ? 'cursor-pointer' : 'cursor-default',
        )}
        style={{
          height: `${height}px`,
          backgroundColor: color,
        }}
      />
      {open && block.tooltip ? (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs text-ink shadow-card"
        >
          {block.tooltip}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Convenience helper: map a per-day coverage ratio (0..1, where 1 = full team
 * present, 0 = nobody) to a TrackerBlock color.
 *
 * 5-step ramp with strong contrast jumps so cells read at a glance even at
 * 20px wide on a 60-day strip.
 *
 * - ≥ 95% present  → soft sage          (very calm, all good)
 * - 85–95%         → cream paper        (calm with eye on it)
 * - 70–85%         → gold accent        (clearly tight)
 * - 50–70%         → orange             (attention required)
 * - < 50%          → red                (coverage alert)
 */
export function coverageColor(ratio: number): string {
  if (ratio >= 0.95) return '#D5E3D9'; // sage tint
  if (ratio >= 0.85) return '#EFE7C8'; // warm cream — visible against white card
  if (ratio >= 0.7)  return '#D8B11B'; // gold solid
  if (ratio >= 0.5)  return '#F59B42'; // orange
  return '#C92B12';                     // red
}
