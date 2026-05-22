'use client';

import { useMemo, useState } from 'react';
import { EmployeeRow } from './types';
import { Sparkline } from './Sparkline';

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
              {headerCell('avg', 'Avg', 'right')}
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                12m
              </th>
              <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-ardoise">
                Status
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
                <td className="px-4 py-3 text-right text-sm text-slate-ardoise tabular-nums">
                  {emp.avg.toFixed(1)}
                </td>
                <td className="px-4 py-3">
                  <Sparkline data={emp.monthlySparkline} />
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
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-ardoise/70">
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
