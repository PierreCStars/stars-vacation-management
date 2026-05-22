'use client';

import { useState, useEffect, useRef } from 'react';
import { AnalyticsStatus } from './types';

export type FilterState = {
  status: AnalyticsStatus;
  range: 'ytd' | '12m' | 'quarter' | 'custom';
  from?: string;
  to?: string;
  companies: string[];
  types: string[];
};

type Props = {
  value: FilterState;
  options: { companies: string[]; types: string[]; statuses: AnalyticsStatus[] };
  onChange: (next: FilterState) => void;
  onExportCsv: () => void;
};

const RANGE_LABEL: Record<FilterState['range'], string> = {
  ytd: 'This year',
  '12m': 'Last 12 months',
  quarter: 'Last quarter',
  custom: 'Custom',
};

export function AnalyticsFilters({ value, options, onChange, onExportCsv }: Props) {
  const [companyOpen, setCompanyOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const companyRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (companyRef.current && !companyRef.current.contains(e.target as Node)) setCompanyOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setTypeOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleCompany = (c: string) => {
    const next = value.companies.includes(c)
      ? value.companies.filter(x => x !== c)
      : [...value.companies, c];
    onChange({ ...value, companies: next });
  };

  const toggleType = (t: string) => {
    const next = value.types.includes(t)
      ? value.types.filter(x => x !== t)
      : [...value.types, t];
    onChange({ ...value, types: next });
  };

  return (
    <div className="card !p-4 sticky top-16 z-40 backdrop-blur bg-white/95">
      <div className="flex flex-wrap items-center gap-3">
        {/* Range */}
        <div>
          <label className="eyebrow block mb-1">Range</label>
          <select
            value={value.range}
            onChange={(e) => onChange({ ...value, range: e.target.value as FilterState['range'] })}
            className="input-field !py-2 !text-sm min-w-[160px]"
            aria-label="Date range"
          >
            {(Object.keys(RANGE_LABEL) as Array<FilterState['range']>).map(k => (
              <option key={k} value={k}>{RANGE_LABEL[k]}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="eyebrow block mb-1">Status</label>
          <select
            value={value.status}
            onChange={(e) => onChange({ ...value, status: e.target.value as AnalyticsStatus })}
            className="input-field !py-2 !text-sm min-w-[140px]"
            aria-label="Status filter"
          >
            {options.statuses.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Companies */}
        <div ref={companyRef} className="relative">
          <label className="eyebrow block mb-1">Companies</label>
          <button
            type="button"
            onClick={() => setCompanyOpen(v => !v)}
            className="input-field !py-2 !text-sm min-w-[160px] text-left flex items-center justify-between"
            aria-expanded={companyOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {value.companies.length === 0 ? 'All' : `${value.companies.length} selected`}
            </span>
            <span className="text-slate-ardoise/60 ml-2">▾</span>
          </button>
          {companyOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-black/10 rounded-lg shadow-card py-2 z-50 max-h-64 overflow-y-auto">
              {options.companies.map(c => (
                <label key={c} className="flex items-center gap-2 px-3 py-1.5 hover:bg-cream-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.companies.includes(c)}
                    onChange={() => toggleCompany(c)}
                    className="accent-gold"
                  />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Types */}
        <div ref={typeRef} className="relative">
          <label className="eyebrow block mb-1">Types</label>
          <button
            type="button"
            onClick={() => setTypeOpen(v => !v)}
            className="input-field !py-2 !text-sm min-w-[160px] text-left flex items-center justify-between"
            aria-expanded={typeOpen}
            aria-haspopup="listbox"
          >
            <span className="truncate">
              {value.types.length === 0 ? 'All' : `${value.types.length} selected`}
            </span>
            <span className="text-slate-ardoise/60 ml-2">▾</span>
          </button>
          {typeOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-black/10 rounded-lg shadow-card py-2 z-50 max-h-64 overflow-y-auto">
              {options.types.map(t => (
                <label key={t} className="flex items-center gap-2 px-3 py-1.5 hover:bg-cream-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value.types.includes(t)}
                    onChange={() => toggleType(t)}
                    className="accent-gold"
                  />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Reset */}
        {(value.companies.length > 0 || value.types.length > 0 || value.status !== 'approved' || value.range !== '12m') && (
          <button
            type="button"
            onClick={() => onChange({ status: 'approved', range: '12m', companies: [], types: [] })}
            className="btn-ghost !text-xs"
          >
            Reset
          </button>
        )}

        {/* Export */}
        <button
          type="button"
          onClick={onExportCsv}
          className="btn-secondary !py-2.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>
    </div>
  );
}
