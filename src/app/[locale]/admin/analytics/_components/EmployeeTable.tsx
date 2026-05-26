'use client';

import { useMemo, useState } from 'react';
import { EmployeeRow } from './types';
import { Sparkline } from './Sparkline';
import { InfoTooltip } from '@/components/ui/InfoTooltip';

type SortKey = 'userName' | 'company' | 'totalDays' | 'count' | 'avg' | 'lastRequestDate';

type Props = {
  rows: EmployeeRow[];
};

function relativeDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export function EmployeeTable({ rows }: Props) {
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('totalDays');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const companies = useMemo(() => {
    return Array.from(new Set(rows.map(r => r.company))).sort();
  }, [rows]);

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = rows.filter(r => {
      if (companyFilter !== 'all' && r.company !== companyFilter) return false;
      if (q && !r.userName.toLowerCase().includes(q) && !(r.userEmail || '').toLowerCase().includes(q)) return false;
      return true;
    });
    arr = [...arr].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'userName' || sortKey === 'company') {
        return a[sortKey].localeCompare(b[sortKey]) * dir;
      }
      if (sortKey === 'lastRequestDate') {
        const av = a.lastRequestDate ? new Date(a.lastRequestDate).getTime() : 0;
        const bv = b.lastRequestDate ? new Date(b.lastRequestDate).getTime() : 0;
        return (av - bv) * dir;
      }
      return ((a[sortKey] as number) - (b[sortKey] as number)) * dir;
    });
    return arr;
  }, [rows, search, companyFilter, sortKey, sortDir]);

  const headerCell = (key: SortKey, label: string, align: 'left' | 'right' = 'left') => {
    const active = sortKey === key;
    return (
      <th
        scope="col"
        className={`px-4 py-3 text-${align} text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise cursor-pointer select-none hover:text-ink transition-colors`}
        onClick={() => {
          if (active) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
          else { setSortKey(key); setSortDir('desc'); }
        }}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (sortDir === 'asc' ? '↑' : '↓')}
        </span>
      </th>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-field max-w-sm"
          aria-label="Search employees"
        />
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="input-field max-w-xs"
          aria-label="Filter by company"
        >
          <option value="all">All companies</option>
          {companies.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full">
          <thead className="bg-cream-50 border-y border-black/5">
            <tr>
              {headerCell('userName', 'Employee')}
              {headerCell('company', 'Company')}
              {headerCell('totalDays', 'Days', 'right')}
              {headerCell('count', 'Requests', 'right')}
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                12m
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                <span className="inline-flex items-center gap-1">
                  Score congés
                  <InfoTooltip
                    content={
                      <>
                        <strong className="block text-ink mb-1">Score congés</strong>
                        Pondération entre la <strong>fréquence</strong> (nombre de congés par mois)
                        et la <strong>durée</strong> moyenne, calculée sur la période filtrée.
                        <span className="block mt-1.5">
                          Plus le score est faible, plus l'employé est <strong>présent</strong>.
                          Tiers&nbsp;: 0-30 bas, 30-60 moyen, 60-100 élevé.
                        </span>
                      </>
                    }
                  />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                <span className="inline-flex items-center gap-1">
                  Balance
                  <InfoTooltip
                    content={
                      <>
                        <strong className="block text-ink mb-1">Leave balance</strong>
                        <span className="block mb-1.5">
                          Days approved YTD vs the default entitlement (25 d/yr — FR/Monaco statutory).
                          Override with the <code>DEFAULT_LEAVE_ENTITLEMENT</code> env var.
                        </span>
                        <span className="block">
                          The <strong>~Mon</strong> hint = projected month the employee hits zero, based on
                          current pace (usedYTD / months elapsed).
                        </span>
                      </>
                    }
                  />
                </span>
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                <span className="inline-flex items-center gap-1">
                  Status
                  <InfoTooltip
                    content={
                      <>
                        <span className="block">Dots count requests in each status for the current filter:</span>
                        <span className="block mt-1.5">
                          <span style={{ color: '#1F6E3A' }}>●</span> approved
                          {' · '}
                          <span style={{ color: '#F59B42' }}>●</span> pending
                          {' · '}
                          <span style={{ color: '#C92B12' }}>●</span> denied
                          {' · '}
                          <span style={{ color: '#4A4A4A' }}>●</span> cancelled
                        </span>
                      </>
                    }
                  />
                </span>
              </th>
              {headerCell('lastRequestDate', 'Last', 'left')}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredSorted.map((emp) => (
              <tr key={emp.userEmail || emp.userName} className="hover:bg-cream-50/60 transition-colors">
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-ink">{emp.userName}</div>
                  {emp.userEmail && <div className="text-xs text-slate-ardoise/70">{emp.userEmail}</div>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-ardoise">{emp.company}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-ink tabular-nums">
                  {emp.totalDays.toFixed(1)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-ardoise tabular-nums">{emp.count}</td>
                <td className="px-4 py-3">
                  <Sparkline data={emp.monthlySparkline} />
                </td>
                <td className="px-4 py-3">
                  <LeaveScoreCell score={emp.leaveScore} />
                </td>
                <td className="px-4 py-3">
                  <BalanceCell balance={emp.leaveBalance} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
                    {emp.statusCounts.approved > 0 && (
                      <span style={{ color: '#1F6E3A' }} title="Approved">●{emp.statusCounts.approved}</span>
                    )}
                    {emp.statusCounts.pending > 0 && (
                      <span style={{ color: '#F59B42' }} title="Pending">●{emp.statusCounts.pending}</span>
                    )}
                    {emp.statusCounts.denied > 0 && (
                      <span style={{ color: '#C92B12' }} title="Denied">●{emp.statusCounts.denied}</span>
                    )}
                    {emp.statusCounts.cancelled > 0 && (
                      <span style={{ color: '#4A4A4A' }} title="Cancelled">●{emp.statusCounts.cancelled}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-ardoise/80 whitespace-nowrap">
                  {relativeDate(emp.lastRequestDate)}
                </td>
              </tr>
            ))}
            {filteredSorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-ardoise/70">
                  No employees match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── LeaveScoreCell ────────────────────────────────────────────────────────
function LeaveScoreCell({ score }: { score: EmployeeRow['leaveScore'] }) {
  // Tier colours:
  //   low    → elegant green (#1F6E3A) — very present
  //   medium → gold           (#D8B11B) — balanced
  //   high   → orange         (#F59B42) — frequent + long absences
  const color =
    score.tier === 'low' ? '#1F6E3A' : score.tier === 'medium' ? '#D8B11B' : '#F59B42';

  // Edge case: no leave at all over the window → "—"
  if (score.freqPerMonth === 0 && score.avgDuration === 0) {
    return <span className="text-xs text-slate-ardoise/40">—</span>;
  }

  return (
    <div className="min-w-[80px]">
      <div className="text-sm font-semibold tabular-nums" style={{ color }}>
        {score.value}
      </div>
      <div className="mt-1 h-1.5 bg-cream-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${score.value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ─── BalanceCell ───────────────────────────────────────────────────────────
function BalanceCell({ balance }: { balance: EmployeeRow['leaveBalance'] }) {
  const pct = balance.entitlement > 0 ? Math.min(150, (balance.usedYTD / balance.entitlement) * 100) : 0;
  const isOver = balance.overQuota;
  const willHitZeroSoon =
    balance.projectedZeroDate &&
    new Date(balance.projectedZeroDate).getFullYear() === new Date().getFullYear();

  // Bar color: green calm → gold tight → red over
  const barColor = isOver
    ? '#C92B12'
    : pct >= 80
      ? '#D8B11B'
      : '#1F6E3A';

  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold tabular-nums" style={{ color: barColor }}>
          {balance.usedYTD.toFixed(1)} / {balance.entitlement}
        </span>
        {isOver ? (
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#C92B12' }}>
            over
          </span>
        ) : willHitZeroSoon ? (
          <span className="text-[10px] uppercase tracking-wider text-slate-ardoise/80">
            ~{new Date(balance.projectedZeroDate!).toLocaleDateString('en-US', { month: 'short' })}
          </span>
        ) : null}
      </div>
      <div className="mt-1 h-1.5 bg-cream-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}
