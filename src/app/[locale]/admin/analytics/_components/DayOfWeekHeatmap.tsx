'use client';

import { useMemo, useState } from 'react';

type Props = {
  from: string;
  to: string;
  maxCellValue: number;
  weeks: Array<{ weekStart: string; days: number[] }>;
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * 7×N heatmap of approved leave person-days.
 * Rows = days of week (Mon top, Sun bottom). Columns = ISO weeks across the filter range.
 *
 * Pattern source: research brief (May 2026) — adapted from GitHub contribution graph
 * and CharlieHR / Personio day-of-week reporting.
 */
export function DayOfWeekHeatmap({ from, to, maxCellValue, weeks }: Props) {
  const [hover, setHover] = useState<{ weekStart: string; dow: number; value: number } | null>(null);

  const totals = useMemo(() => {
    const perDow = [0, 0, 0, 0, 0, 0, 0];
    let grandTotal = 0;
    weeks.forEach(w => w.days.forEach((d, i) => { perDow[i] += d; grandTotal += d; }));
    return { perDow, grandTotal };
  }, [weeks]);

  // Month labels above columns — show first column of each new month
  const monthLabels = useMemo(() => {
    const out: Array<{ index: number; label: string }> = [];
    let lastMonth = -1;
    weeks.forEach((w, i) => {
      const d = new Date(w.weekStart);
      const m = d.getMonth();
      if (m !== lastMonth) {
        out.push({ index: i, label: d.toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = m;
      }
    });
    return out;
  }, [weeks]);

  if (!weeks.length) {
    return (
      <div className="py-8 text-center text-sm text-slate-ardoise/80">
        No leave data for the selected range.
      </div>
    );
  }

  // SLG palette: cream (0) → soft gold → gold (max). Weekends use cool-grey tint.
  const cellColor = (value: number, dow: number): string => {
    if (maxCellValue === 0) return '#F5F2EC';
    if (value === 0) return dow >= 5 ? '#F3F2EE' : '#F5F2EC';
    const intensity = Math.min(1, value / maxCellValue);
    // 0.1 → near-cream, 1.0 → full gold
    // Use rgba ramp from gold #D8B11B with opacity 0.15 → 1
    const opacity = 0.15 + intensity * 0.85;
    return `rgba(216, 177, 27, ${opacity})`;
  };

  const cellSize = 14;
  const gap = 2;
  const cols = weeks.length;
  const rows = 7;
  const width = cols * (cellSize + gap) - gap;
  const monthLabelHeight = 14;
  const dayLabelWidth = 28;

  return (
    <div className="overflow-x-auto">
      <div className="relative inline-block min-w-full">
        {/* Hover info */}
        <div className="mb-3 flex items-baseline justify-between text-xs">
          <div className="text-slate-ardoise/80">
            {hover ? (
              <>
                <span className="font-medium text-ink">
                  {new Date(hover.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {DAY_LABELS[hover.dow]}
                </span>
                {' — '}
                <span className="text-slate-ardoise">{hover.value} person-day{hover.value === 1 ? '' : 's'} of leave</span>
              </>
            ) : (
              <span className="text-slate-ardoise/60">Hover a cell · {totals.grandTotal} total person-days, {from} → {to}</span>
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-ardoise/70">
            <span>0</span>
            <span className="flex h-2.5 w-24 rounded-sm overflow-hidden">
              {[0.15, 0.3, 0.5, 0.7, 0.85, 1].map((o, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: `rgba(216, 177, 27, ${o})` }} />
              ))}
            </span>
            <span>{maxCellValue}</span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex" style={{ gap: `${gap}px` }}>
          {/* Day labels column */}
          <div className="flex flex-col justify-between" style={{ width: dayLabelWidth, paddingTop: monthLabelHeight + gap }}>
            {DAY_LABELS.map((d, i) => (
              <div
                key={d}
                className={`text-[10px] uppercase tracking-widest leading-none ${i === 0 || i === 4 ? 'text-slate-ardoise' : 'text-transparent'}`}
                style={{ height: cellSize }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap body */}
          <div className="relative">
            {/* Month labels */}
            <div className="relative" style={{ height: monthLabelHeight, marginBottom: gap }}>
              {monthLabels.map(m => (
                <div
                  key={`${m.index}-${m.label}`}
                  className="absolute text-[10px] uppercase tracking-widest text-slate-ardoise/70"
                  style={{ left: m.index * (cellSize + gap), top: 0 }}
                >
                  {m.label}
                </div>
              ))}
            </div>

            {/* Cells: rows = day of week, cols = weeks */}
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
                gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
                gap: `${gap}px`,
              }}
            >
              {Array.from({ length: rows * cols }).map((_, idx) => {
                const dow = idx % rows; // 0=Mon..6=Sun
                const col = Math.floor(idx / rows);
                const week = weeks[col];
                const value = week.days[dow];
                return (
                  <button
                    key={`${col}-${dow}`}
                    type="button"
                    onMouseEnter={() => setHover({ weekStart: week.weekStart, dow, value })}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover({ weekStart: week.weekStart, dow, value })}
                    onBlur={() => setHover(null)}
                    className="rounded-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: cellColor(value, dow),
                      gridColumn: col + 1,
                      gridRow: dow + 1,
                    }}
                    aria-label={`${new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${DAY_LABELS[dow]}: ${value} person-days`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Per-day-of-week totals */}
        <div className="mt-4 flex gap-2" style={{ paddingLeft: dayLabelWidth + gap }}>
          {DAY_LABELS.map((label, i) => {
            const total = totals.perDow[i];
            const pct = totals.grandTotal > 0 ? (total / totals.grandTotal) * 100 : 0;
            return (
              <div key={label} className="flex-1 text-center">
                <div className="text-[10px] uppercase tracking-widest text-slate-ardoise/70 mb-1">{label}</div>
                <div className="text-sm font-semibold text-ink tabular-nums">{total}</div>
                <div className="text-[10px] text-slate-ardoise/60 tabular-nums">{pct.toFixed(0)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
