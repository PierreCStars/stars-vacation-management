'use client';

import { useMemo } from 'react';
import { Tracker, coverageColor, type TrackerBlock } from '@/components/ui/Tracker';
import type { CoverageEmployee } from './types';

type Props = {
  from: string;
  to: string;
  employees: CoverageEmployee[];
  /** Total headcount across the org (denominator for the coverage ratio). */
  totalHeadcount: number;
  companyFilter?: string[] | null;
};

/**
 * One coloured block per day in the [from, to] range.
 * Colour reflects the share of the team present that day (1 = full team, 0 = nobody).
 */
export function CoverageDensityTracker({
  from,
  to,
  employees,
  totalHeadcount,
  companyFilter,
}: Props) {
  const filtered = useMemo(() => {
    if (!companyFilter || companyFilter.length === 0) return employees;
    return employees.filter(e => companyFilter.includes(e.company));
  }, [employees, companyFilter]);

  const denominator = companyFilter && companyFilter.length > 0
    ? Math.max(filtered.length, 1)
    : Math.max(totalHeadcount, filtered.length, 1);

  const blocks = useMemo<TrackerBlock[]>(() => {
    const start = new Date(from);
    const end = new Date(to);
    const days: TrackerBlock[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const dayKey = cursor.toISOString().slice(0, 10);
      // count people whose [start, end] covers this day (inclusive)
      let away = 0;
      for (const emp of filtered) {
        for (const leave of emp.leaves) {
          const ls = new Date(leave.start);
          const le = new Date(leave.end);
          if (cursor >= ls && cursor <= le) {
            away++;
            break;
          }
        }
      }
      const presentRatio = 1 - away / denominator;
      const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      const displayDate = cursor.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      days.push({
        key: dayKey,
        color: isWeekend ? '#E5E7EB' : coverageColor(presentRatio),
        tooltip: isWeekend
          ? `${displayDate} · weekend`
          : `${displayDate} · ${away}/${denominator} away (${Math.round(presentRatio * 100)}% present)`,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [from, to, filtered, denominator]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="eyebrow text-slate-ardoise">Coverage density · 60 days</p>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-slate-ardoise/70">
          <Legend swatch="#F5F2EC" label="≥ 85% present" />
          <Legend swatch="rgba(216, 177, 27, 0.35)" label="70–85%" />
          <Legend swatch="#F59B42" label="50–70%" />
          <Legend swatch="#C92B12" label="< 50%" />
        </div>
      </div>
      <Tracker data={blocks} blockHeight={20} gap={1} />
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: swatch }} />
      {label}
    </span>
  );
}
