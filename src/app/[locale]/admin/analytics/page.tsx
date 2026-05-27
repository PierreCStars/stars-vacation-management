'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnalyticsKpi } from './_components/AnalyticsKpi';
import { CoverageTimeline } from './_components/CoverageTimeline';
import { CoverageDensityTracker } from './_components/CoverageDensityTracker';
import { SeasonalityChart } from './_components/SeasonalityChart';
import { CompanyBreakdown } from './_components/CompanyBreakdown';
import { DayOfWeekHeatmap } from './_components/DayOfWeekHeatmap';
import { EmployeeTable } from './_components/EmployeeTable';
import { AnalyticsFilters, FilterState } from './_components/AnalyticsFilters';
import { AnalyticsPayload } from './_components/types';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

/** Format a duration in hours as "Nh" (<48h) or "N.N d" (≥48h). "—" if null. */
function fmtHours(h: number | null): string {
  if (h === null || h === undefined) return '—';
  return h > 48 ? `${(h / 24).toFixed(1)} d` : `${h.toFixed(0)} h`;
}

function rangeToDates(range: FilterState['range']): { from?: string; to?: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'ytd') {
    return { from: `${now.getFullYear()}-01-01`, to: today.toISOString().slice(0, 10) };
  }
  if (range === '12m') {
    const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
  }
  if (range === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const from = new Date(now.getFullYear(), q * 3, 1);
    return { from: from.toISOString().slice(0, 10), to: today.toISOString().slice(0, 10) };
  }
  return {};
}

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<FilterState>({
    status: 'approved',
    range: '12m',
    companies: [],
    types: [],
  });
  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'days' | 'count'>('days');

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ status: filters.status });
    const dates = rangeToDates(filters.range);
    if (dates.from) params.set('from', dates.from);
    if (dates.to) params.set('to', dates.to);
    if (filters.companies.length) params.set('companies', filters.companies.join(','));
    if (filters.types.length) params.set('types', filters.types.join(','));
    return params.toString();
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analytics/vacations?${queryString}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [queryString]);

  const onExportCsv = () => {
    window.location.href = `/api/analytics/vacations.csv?${queryString}`;
  };

  if (loading && !data) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin mb-3" />
          <p className="text-sm text-slate-ardoise">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="card text-center max-w-md mx-auto">
          <p className="eyebrow mb-3" style={{ color: '#C92B12' }}>Error</p>
          <h2 className="!text-xl !font-semibold mb-3">Failed to load analytics</h2>
          <p className="text-sm text-slate-ardoise/90 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <header>
        <div className="text-xs text-slate-ardoise/70 mb-2">
          <span>Administration</span> <span className="mx-1.5">/</span> <span className="text-ink font-medium">Analytics</span>
        </div>
        <h1 className="!font-light tracking-tight">Vacation Analytics</h1>
        <p className="text-sm text-slate-ardoise/90 mt-2">
          Patterns, coverage, and team rhythms — {data.meta.totalRequests} requests in current view.
        </p>
      </header>

      {/* Filters bar */}
      <AnalyticsFilters
        value={filters}
        options={data.filterOptions}
        onChange={setFilters}
        onExportCsv={onExportCsv}
      />

      {/* ── Zone 1: Now ──────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="filet-gold" />
          <p className="eyebrow">Now — operational</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalyticsKpi
            label="On leave today"
            value={data.now.currentlyAway.count}
            accent="gold"
            hint={data.now.currentlyAway.list.length > 0
              ? data.now.currentlyAway.list.slice(0, 3).map(p => p.userName).join(' · ') + (data.now.currentlyAway.list.length > 3 ? ` +${data.now.currentlyAway.list.length - 3}` : '')
              : 'Nobody is away today.'}
            info={
              <>
                <strong className="block text-ink mb-1">Currently away</strong>
                People whose approved leave covers <em>today</em>:
                <code className="block mt-1.5 text-[11px] text-slate-ardoise/80">startDate ≤ today ≤ endDate</code>
                Hover the card hint to see the first names. Pending leaves are excluded.
              </>
            }
          />
          <AnalyticsKpi
            label="Returning this week"
            value={data.now.returningThisWeek.count}
            hint={data.now.returningThisWeek.list.length > 0
              ? data.now.returningThisWeek.list.slice(0, 3).map(p => p.userName).join(' · ')
              : 'No returns this week.'}
            info={
              <>
                <strong className="block text-ink mb-1">Returning this week</strong>
                Approved leaves whose <em>endDate</em> falls between Monday and Sunday of the
                current week. Useful to anticipate next week's headcount bump.
              </>
            }
          />
          <AnalyticsKpi
            label="Pending approvals"
            value={data.now.pendingApprovals.count}
            accent={data.now.pendingApprovals.oldestAgeDays >= 7 ? 'danger' : data.now.pendingApprovals.count > 0 ? 'pending' : 'ink'}
            hint={data.now.pendingApprovals.count > 0
              ? `Oldest: ${data.now.pendingApprovals.oldestAgeDays}d`
              : 'All caught up.'}
            info={
              <>
                <strong className="block text-ink mb-1">Pending approvals</strong>
                Requests still in <em>pending</em> status. The hint shows the age of the
                <strong> oldest</strong> pending in days. The card turns red when the oldest is
                ≥ 7 days, orange when there's any pending, neutral when empty.
              </>
            }
          />
          <AnalyticsKpi
            label="Days approved YTD"
            value={data.now.daysApprovedYTD.total.toFixed(1)}
            accent="success"
            trend={{ pct: data.now.daysApprovedYTD.deltaPct, label: 'vs prev year' }}
            hint={`Previous YTD: ${data.now.daysApprovedYTD.prevYearTotal.toFixed(1)} days`}
            info={
              <>
                <strong className="block text-ink mb-1">Days approved YTD</strong>
                Sum of approved leave days with <em>startDate</em> in the current year so far.
                <span className="block mt-1.5">
                  The trend arrow compares to the <strong>same period last year</strong>
                  (Jan 1 → today's date in the previous year), not the full previous year.
                </span>
              </>
            }
          />
        </div>

        {/* Coverage timeline */}
        <div className="card mt-6 space-y-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="!text-lg !font-semibold inline-flex items-center gap-2">
                Coverage — next 60 days
                <InfoTooltip
                  content={
                    <>
                      <strong className="block text-ink mb-1">Coverage block</strong>
                      Two views of the same window:
                      <span className="block mt-1.5">
                        <strong>Density strip</strong> — one cell per day, colour = share of the team
                        present. Reveals the days where coverage is tight at a glance.
                      </span>
                      <span className="block mt-1.5">
                        <strong>Per-employee timeline</strong> — every person's leaves laid out on the
                        same 60-day timeline, grouped by company. Approved leaves render solid;
                        pending leaves are dashed and orange.
                      </span>
                    </>
                  }
                />
              </h2>
              <p className="text-xs text-slate-ardoise/80 mt-1">
                Density strip + per-employee timeline. Approved (solid) and pending (dashed).
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-ardoise/70">
              {data.coverageTimeline.from} → {data.coverageTimeline.to}
            </span>
          </div>
          <CoverageDensityTracker
            from={data.coverageTimeline.from}
            to={data.coverageTimeline.to}
            employees={data.coverageTimeline.employees}
            totalHeadcount={data.employees.length}
            companyFilter={filters.companies.length ? filters.companies : null}
          />
          <div className="border-t border-black/5 pt-4">
            <CoverageTimeline
              from={data.coverageTimeline.from}
              to={data.coverageTimeline.to}
              employees={data.coverageTimeline.employees}
              companyFilter={filters.companies.length ? filters.companies : null}
            />
          </div>
        </div>
      </section>

      {/* ── Zone 2: Patterns ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="filet-gold" />
          <p className="eyebrow">Patterns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seasonality */}
          <div className="card lg:col-span-2">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="!text-lg !font-semibold inline-flex items-center gap-2">
                Seasonality
                <InfoTooltip
                  content={
                    <>
                      <strong className="block text-ink mb-1">Seasonality</strong>
                      Approved leave days bucketed by <em>start date</em> per month (not by request
                      creation date). The dashed slate line overlays the same metric for the
                      previous year for direct year-over-year comparison.
                    </>
                  }
                />
              </h2>
              <span className="text-xs text-slate-ardoise/80">By start date · approved only</span>
            </div>
            <SeasonalityChart
              currentYear={data.seasonality.currentYear}
              previousYear={data.seasonality.previousYear}
            />
          </div>

          {/* Approval performance */}
          <div className="card flex flex-col">
            <h2 className="!text-lg !font-semibold mb-4 inline-flex items-center gap-2">
              Approval rhythm
              <InfoTooltip
                content={
                  <>
                    <strong className="block text-ink mb-1">Approval rhythm</strong>
                    Computed across requests in <em>reviewed</em> states (approved + denied) in the
                    current filter view.
                    <span className="block mt-1.5">
                      <strong>% approved / denied</strong> is the share of each outcome.
                    </span>
                    <span className="block mt-1.5">
                      <strong>Avg / median / fastest / slowest review time</strong> = the delay
                      between request creation and admin decision (the per-request submission→validation
                      delta), summarised across all reviewed requests. Displayed in hours under 48h,
                      then days.
                    </span>
                  </>
                }
              />
            </h2>
            <div className="space-y-5 flex-1">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-ardoise/80">Approved</span>
                  <span className="text-sm font-semibold" style={{ color: '#1F6E3A' }}>{data.approvalPerf.approvedPct}%</span>
                </div>
                <div className="h-1.5 bg-cream-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${data.approvalPerf.approvedPct}%`, backgroundColor: '#1F6E3A' }} />
                </div>
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-ardoise/80">Denied</span>
                  <span className="text-sm font-semibold" style={{ color: '#C92B12' }}>{data.approvalPerf.deniedPct}%</span>
                </div>
                <div className="h-1.5 bg-cream-100 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${data.approvalPerf.deniedPct}%`, backgroundColor: '#C92B12' }} />
                </div>
              </div>
              <div className="pt-4 border-t border-black/5">
                <p className="eyebrow mb-1">Avg review time</p>
                <p className="text-2xl font-light text-ink">{fmtHours(data.approvalPerf.avgApprovalHours)}</p>
                <p className="text-xs text-slate-ardoise/70 mt-1">
                  Across {data.approvalPerf.totalReviewed} reviewed requests
                </p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-ardoise/70">Fastest</p>
                    <p className="text-sm font-semibold text-ink">{fmtHours(data.approvalPerf.minApprovalHours)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-ardoise/70">Median</p>
                    <p className="text-sm font-semibold text-ink">{fmtHours(data.approvalPerf.medianApprovalHours)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-ardoise/70">Slowest</p>
                    <p className="text-sm font-semibold text-ink">{fmtHours(data.approvalPerf.maxApprovalHours)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Company breakdown */}
        <div className="card mt-6">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="!text-lg !font-semibold inline-flex items-center gap-2">
                By company & leave type
                <InfoTooltip
                  content={
                    <>
                      <strong className="block text-ink mb-1">By company & leave type</strong>
                      One horizontal bar per subsidiary, sized by the total selected metric.
                      Segments show the leave-type breakdown within each company.
                      <span className="block mt-1.5">
                        Toggle <strong>Days</strong> ↔ <strong>Requests</strong> with the chips on
                        the right. Days reflect volume (long leaves matter); Requests reflect
                        frequency (many short ones matter).
                      </span>
                    </>
                  }
                />
              </h2>
              <p className="text-xs text-slate-ardoise/80 mt-1">Horizontal bars sized by total — segments by leave type.</p>
            </div>
            <div className="inline-flex bg-cream-100 rounded-lg p-1 text-xs">
              <button
                type="button"
                onClick={() => setMetric('days')}
                className={`px-3 py-1.5 rounded-md transition-colors ${metric === 'days' ? 'bg-white text-ink font-semibold shadow-sm' : 'text-slate-ardoise hover:text-ink'}`}
              >
                Days
              </button>
              <button
                type="button"
                onClick={() => setMetric('count')}
                className={`px-3 py-1.5 rounded-md transition-colors ${metric === 'count' ? 'bg-white text-ink font-semibold shadow-sm' : 'text-slate-ardoise hover:text-ink'}`}
              >
                Requests
              </button>
            </div>
          </div>
          <CompanyBreakdown data={data.companyTypeBreakdown} metric={metric} />
        </div>

        {/* Day-of-week heatmap */}
        <div className="card mt-6">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="!text-lg !font-semibold inline-flex items-center gap-2">
                Day-of-week rhythm
                <InfoTooltip
                  content={
                    <>
                      <strong className="block text-ink mb-1">Day-of-week rhythm</strong>
                      A 7-row × N-week grid covering the filter range. Each cell counts the
                      <strong> person-days of approved leave</strong> on that specific date —
                      one person away for 3 days adds +1 to each of those 3 cells.
                      <span className="block mt-1.5">
                        Look for patterns: Monday spikes (sick-leave proxy), Friday clusters
                        (long weekends), summer concentration. The totals row below sums each
                        weekday across the whole range.
                      </span>
                    </>
                  }
                />
              </h2>
              <p className="text-xs text-slate-ardoise/80 mt-1">
                Each cell = person-days of approved leave on that specific date. Surfaces patterns
                like Monday spikes (sick proxy) or popular Fridays.
              </p>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-slate-ardoise/70">
              {data.dayOfWeekHeatmap.from} → {data.dayOfWeekHeatmap.to}
            </span>
          </div>
          <DayOfWeekHeatmap
            from={data.dayOfWeekHeatmap.from}
            to={data.dayOfWeekHeatmap.to}
            maxCellValue={data.dayOfWeekHeatmap.maxCellValue}
            weeks={data.dayOfWeekHeatmap.weeks}
          />
        </div>
      </section>

      {/* ── Zone 3: People ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <span className="filet-gold" />
          <p className="eyebrow">People</p>
        </div>
        <div className="card">
          <div className="flex items-baseline justify-between mb-5">
            <div>
              <h2 className="!text-lg !font-semibold">Employee summary</h2>
              <p className="text-xs text-slate-ardoise/80 mt-1">Search, filter, and sort — sparklines show last 12 months.</p>
            </div>
            <span className="text-xs text-slate-ardoise/80 tabular-nums">{data.employees.length} employees</span>
          </div>
          <EmployeeTable rows={data.employees} />
        </div>
      </section>

      {/* Footer note */}
      <footer className="text-[10px] text-slate-ardoise/60 text-center uppercase tracking-widest">
        Generated {new Date(data.meta.generatedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
      </footer>
    </div>
  );
}
