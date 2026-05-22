'use client';

import { useMemo, useState } from 'react';
import { CoverageEmployee, colorForType } from './types';

type Props = {
  from: string;
  to: string;
  employees: CoverageEmployee[];
  companyFilter?: string[] | null;
};

/**
 * Gantt-like coverage timeline. One row per employee, segments per leave.
 * Renders pure CSS — no chart lib.
 */
export function CoverageTimeline({ from, to, employees, companyFilter }: Props) {
  const [hoveredLeave, setHoveredLeave] = useState<string | null>(null);

  const { startMs, totalMs, weekTicks, todayPct } = useMemo(() => {
    const startDate = new Date(from);
    const endDate = new Date(to);
    const start = startDate.getTime();
    const end = endDate.getTime();
    const total = end - start;
    const todayMs = Date.now();
    const todayPctValue = ((todayMs - start) / total) * 100;

    // Mark each Monday in the range
    const ticks: Array<{ label: string; pct: number }> = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      if (cursor.getDay() === 1) {
        const pct = ((cursor.getTime() - start) / total) * 100;
        ticks.push({
          label: cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          pct,
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return { startMs: start, totalMs: total, weekTicks: ticks, todayPct: todayPctValue };
  }, [from, to]);

  const filteredEmployees = useMemo(() => {
    if (!companyFilter || companyFilter.length === 0) return employees;
    return employees.filter(e => companyFilter.includes(e.company));
  }, [employees, companyFilter]);

  const groupedByCompany = useMemo(() => {
    const groups = new Map<string, CoverageEmployee[]>();
    filteredEmployees.forEach(e => {
      if (!groups.has(e.company)) groups.set(e.company, []);
      groups.get(e.company)!.push(e);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredEmployees]);

  if (filteredEmployees.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-ardoise/80">
        Nobody is scheduled to be away in the next 60 days.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Week tick header */}
        <div className="relative h-8 mb-2 border-b border-black/5">
          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: '160px 1fr' }}>
            <div />
            <div className="relative">
              {weekTicks.map((t, i) => (
                <div
                  key={i}
                  className="absolute top-1 text-[10px] uppercase tracking-widest text-slate-ardoise/70"
                  style={{ left: `${t.pct}%`, transform: 'translateX(-50%)' }}
                >
                  {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="space-y-4">
          {groupedByCompany.map(([company, emps]) => (
            <div key={company}>
              <p className="eyebrow !text-[10px] mb-1.5 text-slate-ardoise">{company}</p>
              <div className="space-y-1">
                {emps.map((emp) => (
                  <div
                    key={`${company}-${emp.userName}`}
                    className="grid items-center gap-3"
                    style={{ gridTemplateColumns: '160px 1fr' }}
                  >
                    <div className="text-sm font-medium text-ink truncate" title={emp.userName}>
                      {emp.userName}
                    </div>
                    <div className="relative h-7 bg-cream-100 rounded">
                      {/* Today marker */}
                      {todayPct >= 0 && todayPct <= 100 && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-ink z-10"
                          style={{ left: `${todayPct}%` }}
                          aria-label="today"
                        />
                      )}
                      {/* Leaves */}
                      {emp.leaves.map((leave, idx) => {
                        const leaveStart = new Date(leave.start).getTime();
                        const leaveEnd = new Date(leave.end).getTime() + 86_400_000; // include end day
                        const left = Math.max(0, ((leaveStart - startMs) / totalMs) * 100);
                        const width = Math.max(0.8, ((leaveEnd - leaveStart) / totalMs) * 100);
                        const id = `${company}-${emp.userName}-${idx}`;
                        const isPending = leave.status === 'pending';
                        const bg = isPending ? '#F59B42' : colorForType(leave.type);
                        const opacity = hoveredLeave === id ? 1 : 0.85;
                        return (
                          <div
                            key={id}
                            onMouseEnter={() => setHoveredLeave(id)}
                            onMouseLeave={() => setHoveredLeave(null)}
                            className="absolute top-1 bottom-1 rounded text-[10px] px-1 overflow-hidden text-white font-medium cursor-default transition-opacity"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: bg,
                              opacity,
                              border: isPending ? '1px dashed rgba(0,0,0,0.2)' : 'none',
                            }}
                            title={`${leave.type} · ${leave.status} · ${leave.start} → ${leave.end}`}
                          >
                            <span className="whitespace-nowrap">{leave.type}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-5 flex flex-wrap items-center gap-4 pt-4 border-t border-black/5">
          <div className="flex items-center gap-2">
            <span className="block w-3 h-3 rounded" style={{ backgroundColor: '#1F6E3A' }} />
            <span className="text-xs text-slate-ardoise">Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block w-3 h-3 rounded" style={{ backgroundColor: '#F59B42', border: '1px dashed rgba(0,0,0,0.3)' }} />
            <span className="text-xs text-slate-ardoise">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="block w-px h-3 bg-ink" />
            <span className="text-xs text-slate-ardoise">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
