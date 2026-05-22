export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getVacationRequests } from "@/lib/analytics/data";
import { normalizeVacationStatus, normalizeVacationType } from "@/lib/normalize-vacation-fields";
import { calculateVacationDuration } from "@/lib/duration-calculator";

type VR = {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  company?: string;
  type?: string;
  status?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  reason?: string;
  createdAt?: any;
  updatedAt?: any;
  reviewedBy?: string;
  reviewerEmail?: string;
  reviewedAt?: any;
  adminComment?: string;
};

function resolveDuration(v: VR): number {
  return calculateVacationDuration({
    durationDays: v.durationDays,
    isHalfDay: v.isHalfDay,
    halfDayType: v.halfDayType,
    startDate: v.startDate,
    endDate: v.endDate
  });
}

// normalizeVacationStatus returns capitalized canonical values ("Approved", "Pending", ...);
// our comparisons throughout this file use lowercase, so we lowercase after normalization.
function statusOf(v: VR): string {
  return normalizeVacationStatus(v.status || '').toLowerCase();
}

function toIsoDate(v: any): string | null {
  if (!v) return null;
  if (typeof v === 'string') {
    try { return new Date(v).toISOString(); } catch { return null; }
  }
  if (v?.toDate && typeof v.toDate === 'function') {
    return v.toDate().toISOString();
  }
  try { return new Date(v).toISOString(); } catch { return null; }
}

function dateRangesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export async function GET(req: Request) {
  try {
    if (!req.url) {
      return NextResponse.json({ error: 'Request URL not available during build time' }, { status: 400 });
    }

    const url = new URL(req.url);
    const statusFilter = (url.searchParams.get("status") || "approved").toLowerCase(); // legacy default
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const companiesParam = url.searchParams.get("companies"); // CSV
    const typesParam = url.searchParams.get("types"); // CSV

    const companiesFilter = companiesParam ? companiesParam.split(',').map(s => s.trim()).filter(Boolean) : null;
    const typesFilter = typesParam ? typesParam.split(',').map(s => s.trim()).filter(Boolean) : null;

    // Fetch ALL data once and filter in-memory — supports cross-status aggregations
    const allRows = await getVacationRequests();

    // ── Time anchors ──────────────────────────────────────────────────────────
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfThisWeek = new Date(today); startOfThisWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
    const endOfThisWeek = new Date(startOfThisWeek); endOfThisWeek.setDate(startOfThisWeek.getDate() + 6); // Sunday
    const startOfYTD = new Date(now.getFullYear(), 0, 1);
    const startOfPrevYTDSamePeriod = new Date(now.getFullYear() - 1, 0, 1);
    const endOfPrevYTDSamePeriod = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const next60dStart = today;
    const next60dEnd = new Date(today); next60dEnd.setDate(today.getDate() + 60);

    // Filter range for analytics (defaults to last 12 months if no from/to)
    const filterFrom = fromParam ? new Date(fromParam) : new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const filterTo = toParam ? new Date(toParam) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const matchFilters = (r: VR): boolean => {
      const cmp = r.company || "—";
      const typ = normalizeVacationType(r.type || (r.isHalfDay ? "Half day" : "Full day"));
      if (companiesFilter && !companiesFilter.includes(cmp)) return false;
      if (typesFilter && !typesFilter.includes(typ)) return false;
      return true;
    };

    const matchStatus = (r: VR): boolean => {
      if (statusFilter === 'all') return true;
      return statusOf(r) === statusFilter;
    };

    const matchDateRange = (r: VR): boolean => {
      if (!r.startDate) return false;
      const start = new Date(r.startDate);
      return start >= filterFrom && start <= filterTo;
    };

    // Apply company/type filters globally (do not apply status/date everywhere)
    const filteredAll = allRows.filter(matchFilters);

    // ── Zone 1: Now — operational ─────────────────────────────────────────────
    const approved = filteredAll.filter(r => statusOf(r) === 'approved');
    const pending  = filteredAll.filter(r => statusOf(r) === 'pending');

    const currentlyAwayList = approved
      .filter(r => r.startDate && r.endDate)
      .filter(r => {
        const s = new Date(r.startDate!);
        const e = new Date(r.endDate!);
        return s <= today && today <= e;
      })
      .map(r => ({
        userName: r.userName || 'Unknown',
        company: r.company || '—',
        type: normalizeVacationType(r.type || ''),
        returnDate: r.endDate,
        days: resolveDuration(r),
      }));

    const returningThisWeekList = approved
      .filter(r => r.endDate)
      .filter(r => {
        const e = new Date(r.endDate!);
        return e >= today && e <= endOfThisWeek;
      })
      .map(r => ({
        userName: r.userName || 'Unknown',
        company: r.company || '—',
        returnDate: r.endDate,
      }));

    const pendingWithAge = pending
      .map(r => {
        const created = toIsoDate(r.createdAt);
        const ageDays = created ? Math.floor((now.getTime() - new Date(created).getTime()) / 86_400_000) : 0;
        return {
          id: r.id,
          userName: r.userName || 'Unknown',
          company: r.company || '—',
          startDate: r.startDate,
          ageDays,
        };
      })
      .sort((a, b) => b.ageDays - a.ageDays);

    const oldestPendingAge = pendingWithAge[0]?.ageDays ?? 0;

    // Days approved YTD vs previous year same period
    const sumApprovedDaysInRange = (start: Date, end: Date): number => {
      return approved
        .filter(r => r.startDate)
        .filter(r => {
          const s = new Date(r.startDate!);
          return s >= start && s <= end;
        })
        .reduce((sum, r) => sum + resolveDuration(r), 0);
    };

    const daysApprovedYTD = sumApprovedDaysInRange(startOfYTD, today);
    const daysApprovedPrevYTD = sumApprovedDaysInRange(startOfPrevYTDSamePeriod, endOfPrevYTDSamePeriod);
    const ytdVsPrevPct = daysApprovedPrevYTD > 0
      ? ((daysApprovedYTD - daysApprovedPrevYTD) / daysApprovedPrevYTD) * 100
      : null;

    // ── Coverage timeline (next 60 days) ──────────────────────────────────────
    // Per-employee leaves in the next 60d window
    const coverageMap = new Map<string, { userName: string; company: string; leaves: Array<{ start: string; end: string; status: string; type: string }> }>();
    filteredAll
      .filter(r => r.startDate && r.endDate)
      .filter(r => ['approved', 'pending'].includes(statusOf(r)))
      .filter(r => {
        const s = new Date(r.startDate!);
        const e = new Date(r.endDate!);
        return dateRangesOverlap(s, e, next60dStart, next60dEnd);
      })
      .forEach(r => {
        const key = r.userEmail || r.userId || r.userName || r.id;
        if (!coverageMap.has(key)) {
          coverageMap.set(key, { userName: r.userName || 'Unknown', company: r.company || '—', leaves: [] });
        }
        coverageMap.get(key)!.leaves.push({
          start: r.startDate!,
          end: r.endDate!,
          status: statusOf(r),
          type: normalizeVacationType(r.type || ''),
        });
      });

    const coverageTimeline = {
      from: next60dStart.toISOString().slice(0, 10),
      to: next60dEnd.toISOString().slice(0, 10),
      employees: Array.from(coverageMap.values())
        .sort((a, b) => a.company.localeCompare(b.company) || a.userName.localeCompare(b.userName)),
    };

    // ── Zone 2: Patterns ──────────────────────────────────────────────────────
    // Saisonnalité — by START date (fixes the createdAt bug)
    const monthlyByStartCurrent: Record<string, { days: number; count: number }> = {};
    const monthlyByStartPrev: Record<string, { days: number; count: number }> = {};

    approved.forEach(r => {
      if (!r.startDate) return;
      const d = new Date(r.startDate);
      const monthKey = d.toISOString().slice(0, 7); // YYYY-MM
      const days = resolveDuration(r);
      if (d.getFullYear() === now.getFullYear()) {
        if (!monthlyByStartCurrent[monthKey]) monthlyByStartCurrent[monthKey] = { days: 0, count: 0 };
        monthlyByStartCurrent[monthKey].days += days;
        monthlyByStartCurrent[monthKey].count += 1;
      } else if (d.getFullYear() === now.getFullYear() - 1) {
        if (!monthlyByStartPrev[monthKey]) monthlyByStartPrev[monthKey] = { days: 0, count: 0 };
        monthlyByStartPrev[monthKey].days += days;
        monthlyByStartPrev[monthKey].count += 1;
      }
    });

    const buildMonthSeries = (year: number, src: Record<string, { days: number; count: number }>) => {
      return Array.from({ length: 12 }).map((_, m) => {
        const key = `${year}-${String(m + 1).padStart(2, '0')}`;
        return { month: key, days: src[key]?.days || 0, count: src[key]?.count || 0 };
      });
    };

    const seasonality = {
      currentYear: { year: now.getFullYear(), series: buildMonthSeries(now.getFullYear(), monthlyByStartCurrent) },
      previousYear: { year: now.getFullYear() - 1, series: buildMonthSeries(now.getFullYear() - 1, monthlyByStartPrev) },
    };

    // Per-company × type breakdown (counts + days) — based on filter date range, approved only
    const inRange = approved.filter(matchDateRange);
    const byCompanyType: Record<string, Record<string, { count: number; days: number }>> = {};
    inRange.forEach(r => {
      const cmp = r.company || '—';
      const typ = normalizeVacationType(r.type || (r.isHalfDay ? 'Half day' : 'Full day'));
      const days = resolveDuration(r);
      if (!byCompanyType[cmp]) byCompanyType[cmp] = {};
      if (!byCompanyType[cmp][typ]) byCompanyType[cmp][typ] = { count: 0, days: 0 };
      byCompanyType[cmp][typ].count += 1;
      byCompanyType[cmp][typ].days += days;
    });

    const companyTypeBreakdown = Object.entries(byCompanyType).map(([company, types]) => ({
      company,
      totalCount: Object.values(types).reduce((a, b) => a + b.count, 0),
      totalDays: Object.values(types).reduce((a, b) => a + b.days, 0),
      types,
    })).sort((a, b) => b.totalDays - a.totalDays);

    // Approval performance: among reviewed requests (approved + denied)
    const reviewed = filteredAll.filter(r => {
      const s = statusOf(r);
      return s === 'approved' || s === 'denied';
    });
    const approvedCount = reviewed.filter(r => statusOf(r) === 'approved').length;
    const deniedCount = reviewed.filter(r => statusOf(r) === 'denied').length;
    const approvalTimes: number[] = reviewed
      .map(r => {
        const c = toIsoDate(r.createdAt);
        const rev = toIsoDate(r.reviewedAt);
        if (!c || !rev) return null;
        return (new Date(rev).getTime() - new Date(c).getTime()) / 3_600_000; // hours
      })
      .filter((n): n is number => n !== null && n >= 0);

    const approvalPerf = {
      totalReviewed: reviewed.length,
      approvedPct: reviewed.length ? Math.round((approvedCount / reviewed.length) * 100) : 0,
      deniedPct: reviewed.length ? Math.round((deniedCount / reviewed.length) * 100) : 0,
      avgApprovalHours: approvalTimes.length
        ? +(approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length).toFixed(1)
        : null,
    };

    // ── Zone 3: Employees ─────────────────────────────────────────────────────
    type EmpAcc = {
      userId?: string;
      userEmail?: string;
      userName: string;
      company: string;
      totalDays: number;
      count: number;
      lastRequestDate?: string;
      firstRequestDate?: string;
      statusCounts: { approved: number; pending: number; denied: number; cancelled: number };
      monthly: Record<string, number>; // YYYY-MM -> days
    };

    const perEmployee: Record<string, EmpAcc> = {};
    const empPool = statusFilter === 'all' ? filteredAll : filteredAll.filter(matchStatus);

    empPool.forEach(r => {
      const key = r.userEmail || r.userId || r.userName || r.id;
      const days = resolveDuration(r);
      const created = toIsoDate(r.createdAt) || new Date().toISOString();
      const s = statusOf(r);

      if (!perEmployee[key]) {
        perEmployee[key] = {
          userId: r.userId,
          userEmail: r.userEmail,
          userName: r.userName || 'Unknown',
          company: r.company || '—',
          totalDays: 0,
          count: 0,
          lastRequestDate: created,
          firstRequestDate: created,
          statusCounts: { approved: 0, pending: 0, denied: 0, cancelled: 0 },
          monthly: {},
        };
      }
      const emp = perEmployee[key];
      emp.totalDays += days;
      emp.count += 1;
      if (s === 'approved' || s === 'pending' || s === 'denied' || s === 'cancelled') {
        emp.statusCounts[s] += 1;
      }
      if (created < emp.firstRequestDate!) emp.firstRequestDate = created;
      if (created > emp.lastRequestDate!) emp.lastRequestDate = created;

      // Sparkline data uses startDate (when leave is taken), 12 months back
      if (r.startDate && s === 'approved') {
        const sd = new Date(r.startDate);
        const monthKey = sd.toISOString().slice(0, 7);
        const cutoff = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        if (sd >= cutoff) {
          emp.monthly[monthKey] = (emp.monthly[monthKey] || 0) + days;
        }
      }
    });

    // Build 12-month sparkline series for each employee
    const monthBuckets: string[] = Array.from({ length: 12 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d.toISOString().slice(0, 7);
    });

    const employees = Object.values(perEmployee).map(e => ({
      userId: e.userId,
      userEmail: e.userEmail,
      userName: e.userName,
      company: e.company,
      totalDays: +e.totalDays.toFixed(2),
      count: e.count,
      avg: e.count ? +(e.totalDays / e.count).toFixed(2) : 0,
      lastRequestDate: e.lastRequestDate,
      firstRequestDate: e.firstRequestDate,
      statusCounts: e.statusCounts,
      monthlySparkline: monthBuckets.map(m => ({ month: m, days: e.monthly[m] || 0 })),
    })).sort((a, b) => b.totalDays - a.totalDays);

    // ── Legacy aggregations (kept for CSV / back-compat) ──────────────────────
    const legacyPool = statusFilter === 'all' ? filteredAll : filteredAll.filter(matchStatus);

    const byTypeCount: Record<string, number> = {};
    const byCompanyTypeCountLegacy: Record<string, Record<string, number>> = {};
    const byCompanyTypeDaysLegacy: Record<string, Record<string, number>> = {};
    const byReasonCount: Record<string, number> = {};
    const byStatusCount: Record<string, number> = {};
    const monthlyDataLegacy: Record<string, { requests: number; days: number }> = {};

    legacyPool.forEach(r => {
      const days = resolveDuration(r);
      const cmp = r.company || '—';
      const typ = normalizeVacationType(r.type || (r.isHalfDay ? 'Half day' : 'Full day'));
      const created = toIsoDate(r.createdAt) || new Date().toISOString();

      byTypeCount[typ] = (byTypeCount[typ] || 0) + 1;
      if (!byCompanyTypeCountLegacy[cmp]) byCompanyTypeCountLegacy[cmp] = {};
      byCompanyTypeCountLegacy[cmp][typ] = (byCompanyTypeCountLegacy[cmp][typ] || 0) + 1;
      if (!byCompanyTypeDaysLegacy[cmp]) byCompanyTypeDaysLegacy[cmp] = {};
      byCompanyTypeDaysLegacy[cmp][typ] = (byCompanyTypeDaysLegacy[cmp][typ] || 0) + days;
      const reason = r.reason || 'No reason provided';
      byReasonCount[reason] = (byReasonCount[reason] || 0) + 1;
      const sn = statusOf(r) || 'unknown';
      byStatusCount[sn] = (byStatusCount[sn] || 0) + 1;
      const mk = new Date(created).toISOString().slice(0, 7);
      if (!monthlyDataLegacy[mk]) monthlyDataLegacy[mk] = { requests: 0, days: 0 };
      monthlyDataLegacy[mk].requests += 1;
      monthlyDataLegacy[mk].days += days;
    });

    const types = Object.keys(byTypeCount).sort();
    const companies = Object.keys(byCompanyTypeCountLegacy).sort();
    const reasons = Object.keys(byReasonCount).sort();
    const statuses = Object.keys(byStatusCount).sort();
    const months = Object.keys(monthlyDataLegacy).sort();

    // Filter options for the UI
    const availableCompanies = Array.from(new Set(allRows.map(r => r.company || '—'))).sort();
    const availableTypes = Array.from(new Set(allRows.map(r => normalizeVacationType(r.type || '')))).filter(Boolean).sort();

    return NextResponse.json({
      meta: {
        statusFilter,
        totalRequests: legacyPool.length,
        totalAllRequests: allRows.length,
        generatedAt: new Date().toISOString(),
        filterRange: { from: filterFrom.toISOString().slice(0, 10), to: filterTo.toISOString().slice(0, 10) },
        dateRange: allRows.length ? {
          earliest: Math.min(...allRows.map(r => new Date(toIsoDate(r.createdAt) || 0).getTime())),
          latest: Math.max(...allRows.map(r => new Date(toIsoDate(r.createdAt) || 0).getTime())),
        } : undefined,
      },

      // ── New: filter options ──
      filterOptions: {
        companies: availableCompanies,
        types: availableTypes,
        statuses: ['approved', 'pending', 'denied', 'cancelled', 'all'],
      },

      // ── New zone 1: now ──
      now: {
        currentlyAway: { count: currentlyAwayList.length, list: currentlyAwayList },
        returningThisWeek: { count: returningThisWeekList.length, list: returningThisWeekList },
        pendingApprovals: {
          count: pendingWithAge.length,
          oldestAgeDays: oldestPendingAge,
          list: pendingWithAge.slice(0, 10),
        },
        daysApprovedYTD: {
          total: +daysApprovedYTD.toFixed(1),
          prevYearTotal: +daysApprovedPrevYTD.toFixed(1),
          deltaPct: ytdVsPrevPct === null ? null : Math.round(ytdVsPrevPct),
        },
      },

      // ── New: coverage timeline ──
      coverageTimeline,

      // ── New zone 2: patterns ──
      seasonality,
      companyTypeBreakdown,
      approvalPerf,

      // ── New zone 3: employees (with sparklines + status counts) ──
      employees,

      // ── Legacy fields (CSV compat) ──
      freqByType: types.map(t => ({ type: t, count: byTypeCount[t] })),
      freqByCompanyStack: companies.map(c => ({ company: c, ...(byCompanyTypeCountLegacy[c]) })),
      daysByCompanyStack: companies.map(c => ({ company: c, ...(byCompanyTypeDaysLegacy[c]) })),
      freqByReason: reasons.map(r => ({ reason: r, count: byReasonCount[r] })),
      freqByStatus: statuses.map(s => ({ status: s, count: byStatusCount[s] })),
      monthlyTrends: months.map(m => ({ month: m, requests: monthlyDataLegacy[m].requests, days: monthlyDataLegacy[m].days })),
      typeKeys: types,
      companyKeys: companies,
      reasonKeys: reasons,
      statusKeys: statuses,
    });

  } catch (error) {
    console.error('❌ Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
