'use client';

import { ReactNode } from 'react';

type Props = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: { pct: number | null; label?: string };
  accent?: 'gold' | 'ink' | 'pending' | 'success' | 'danger';
};

const ACCENT_COLOR: Record<NonNullable<Props['accent']>, string> = {
  gold: '#D8B11B',
  ink: '#0A0A0A',
  pending: '#F59B42',
  success: '#1F6E3A',
  danger: '#C92B12',
};

export function AnalyticsKpi({ label, value, hint, trend, accent = 'ink' }: Props) {
  const accentColor = ACCENT_COLOR[accent];
  return (
    <div className="card !p-5 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <p className="eyebrow">{label}</p>
        {trend && trend.pct !== null && (
          <span
            className="text-xs font-semibold tracking-wider"
            style={{ color: trend.pct >= 0 ? '#1F6E3A' : '#C92B12' }}
            aria-label={`${trend.pct >= 0 ? 'up' : 'down'} ${Math.abs(trend.pct)} percent`}
          >
            {trend.pct >= 0 ? '▲' : '▼'} {Math.abs(trend.pct)}%
            {trend.label ? <span className="ml-1 text-slate-ardoise/70">{trend.label}</span> : null}
          </span>
        )}
      </div>
      <div className="text-3xl font-light tracking-tight" style={{ color: accentColor }}>
        {value}
      </div>
      {hint && <div className="text-xs text-slate-ardoise/80 leading-snug">{hint}</div>}
    </div>
  );
}
