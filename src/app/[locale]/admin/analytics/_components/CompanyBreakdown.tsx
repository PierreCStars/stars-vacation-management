'use client';

import { useMemo } from 'react';
import { CompanyBreakdownRow, colorForType } from './types';

type Props = {
  data: CompanyBreakdownRow[];
  metric: 'days' | 'count';
};

/**
 * Horizontal stacked bar — one row per company, segments colored by type.
 * Replaces both the pie-by-type and stacked-bar-by-company charts.
 */
export function CompanyBreakdown({ data, metric }: Props) {
  const { allTypes, max } = useMemo(() => {
    const typeSet = new Set<string>();
    let maxValue = 0;
    data.forEach(row => {
      let rowTotal = 0;
      Object.entries(row.types).forEach(([type, vals]) => {
        typeSet.add(type);
        rowTotal += metric === 'days' ? vals.days : vals.count;
      });
      if (rowTotal > maxValue) maxValue = rowTotal;
    });
    return { allTypes: Array.from(typeSet).sort(), max: maxValue };
  }, [data, metric]);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-ardoise/80">
        No data for the selected range.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map(row => {
        const rowTotal = Object.values(row.types).reduce((s, v) => s + (metric === 'days' ? v.days : v.count), 0);
        const widthPct = max > 0 ? (rowTotal / max) * 100 : 0;
        return (
          <div key={row.company}>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium text-ink truncate">{row.company}</span>
              <span className="text-xs text-slate-ardoise">
                {metric === 'days' ? `${rowTotal.toFixed(1)} days` : `${rowTotal} requests`}
              </span>
            </div>
            <div className="h-6 bg-cream-100 rounded overflow-hidden flex" style={{ width: `${widthPct}%`, minWidth: '8%' }}>
              {Object.entries(row.types).map(([type, vals]) => {
                const value = metric === 'days' ? vals.days : vals.count;
                const segPct = rowTotal > 0 ? (value / rowTotal) * 100 : 0;
                if (segPct < 1) return null;
                return (
                  <div
                    key={type}
                    className="h-full flex items-center justify-center text-[10px] font-medium text-white"
                    style={{
                      width: `${segPct}%`,
                      backgroundColor: colorForType(type),
                    }}
                    title={`${type} — ${metric === 'days' ? value.toFixed(1) + ' days' : value + ' requests'}`}
                  >
                    {segPct > 12 ? type.split(' ')[0] : ''}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-black/5">
        {allTypes.map(t => (
          <div key={t} className="flex items-center gap-2">
            <span className="block w-3 h-3 rounded" style={{ backgroundColor: colorForType(t) }} />
            <span className="text-xs text-slate-ardoise">{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
