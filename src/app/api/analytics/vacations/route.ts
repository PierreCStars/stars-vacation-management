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

    // Day-of-week heatmap: 7 rows (Mon..Sun) × N weeks across the filter range.
    // Each cell = person-days of approved leave on that specific date.
    // Useful to surface "Monday spikes" / "everyone takes Fridays" patterns.
    const perDateCount: Map<string, number> = new Map();
    inRange.forEach(r => {
      if (!r.startDate || !r.endDate) return;
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      const cursor = new Date(Math.max(start.getTime(), filterFrom.getTime()));
      const stop = new Date(Math.min(end.getTime(), filterTo.getTime()));
      while (cursor <= stop) {
        const dateKey = cursor.toISOString().slice(0, 10);
        perDateCount.set(dateKey, (perDateCount.get(dateKey) || 0) + 1);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    // Walk every Monday in the filter range to build week buckets
    const heatmapWeeks: Array<{ weekStart: string; days: number[] }> = [];
    const heatmapStart = new Date(filterFrom);
    // Rewind to Monday of that week
    const dayOffset = (heatmapStart.getDay() + 6) % 7; // Mon=0, Sun=6
    heatmapStart.setDate(heatmapStart.getDate() - dayOffset);
    const heatmapCursor = new Date(heatmapStart);
    while (heatmapCursor <= filterTo) {
      const weekStart = heatmapCursor.toISOString().slice(0, 10);
      const days: number[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(heatmapCursor);
        d.setDate(d.getDate() + i);
        const dateKey = d.toISOString().slice(0, 10);
        days.push(perDateCount.get(dateKey) || 0);
      }
      heatmapWeeks.push({ weekStart, days });
      heatmapCursor.setDate(heatmapCursor.getDate() + 7);
    }

    // Pre-compute the max across all cells so the client doesn't have to
    let heatmapMax = 0;
    heatmapWeeks.forEach(w => w.days.forEach(d => { if (d > heatmapMax) heatmapMax = d; }));

    const dayOfWeekHeatmap = {
      from: filterFrom.toISOString().slice(0, 10),
      to: filterTo.toISOString().slice(0, 10),
      maxCellValue: heatmapMax,
      weeks: heatmapWeeks,
    };

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
    // Default leave entitlement per employee per year (in days).
    // Override via env var DEFAULT_LEAVE_ENTITLEMENT.
    // Defaults to 25 — the statutory minimum in France & Monaco.
    const ENTITLEMENT = Number(process.env.DEFAULT_LEAVE_ENTITLEMENT) || 25;
    const startOfYear = new Date(now.getFullYear(), 0, 1);

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
      monthly: Record<string, number>; // YYYY-MM -> days (approved)
      approvedSpells: number;          // distinct approved leaves (all time)
      approvedTotalDays: number;        // sum of approved days (all time)
      approvedDaysYTD: number;          // approved days with startDate ≥ Jan 1 current year
      approvedSpellsWindow: number;    // approved leaves with startDate within filter window
      approvedDaysWindow: number;       // approved days within filter window
      lastApprovedStartDate: string | null;
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
          approvedSpells: 0,
          approvedTotalDays: 0,
          approvedDaysYTD: 0,
          approvedSpellsWindow: 0,
          approvedDaysWindow: 0,
          lastApprovedStartDate: null,
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

      // Approved-only metrics (sparkline, days-to-zero, leave score)
      if (r.startDate && s === 'approved') {
        emp.approvedSpells += 1;
        emp.approvedTotalDays += days;

        const sd = new Date(r.startDate);

        if (sd >= startOfYear) {
          emp.approvedDaysYTD += days;
        }

        if (sd >= filterFrom && sd <= filterTo) {
          emp.approvedSpellsWindow += 1;
          emp.approvedDaysWindow += days;
        }

        if (!emp.lastApprovedStartDate || r.startDate > emp.lastApprovedStartDate) {
          emp.lastApprovedStartDate = r.startDate;
        }

        // Sparkline data (12 months back)
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

    // Months elapsed since Jan 1 (used for pace / projection)
    const monthsElapsed = Math.max(0.1, (now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24 * 30.4375));

    // Length of the analytics filter window in months — denominator for the leave score.
    const monthsInWindow = Math.max(
      0.5,
      (filterTo.getTime() - filterFrom.getTime()) / (1000 * 60 * 60 * 24 * 30.4375),
    );

    const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

    const employees = Object.values(perEmployee).map(e => {
      // ── Leave score (0-100, frequency × duration over the filter window) ────
      // freqNorm  : 0 →  0, 1×/mo → 33, 3×/mo → 99 (clamped to 100)
      // durNorm   : 1d →  0, 5d → 80, 6d+ → 100
      // score     : (freqNorm + durNorm) / 2 — equal weight, both must matter.
      // Lower score = more present, higher score = more often / longer absent.
      const freqPerMonth = e.approvedSpellsWindow / monthsInWindow;
      const avgDuration =
        e.approvedSpellsWindow > 0 ? e.approvedDaysWindow / e.approvedSpellsWindow : 0;
      const freqNorm = clamp(freqPerMonth * 33, 0, 100);
      const durNorm = clamp((avgDuration - 1) * 20, 0, 100);
      const leaveScoreValue = Math.round((freqNorm + durNorm) / 2);
      const leaveScoreTier: 'low' | 'medium' | 'high' =
        leaveScoreValue >= 60 ? 'high' : leaveScoreValue >= 30 ? 'medium' : 'low';

      // ── Days-to-zero projection (Sprint 3) ──────────────────────────────────
      const usedYTD = +e.approvedDaysYTD.toFixed(1);
      const remaining = Math.max(0, ENTITLEMENT - usedYTD);
      const pace = usedYTD / monthsElapsed; // days per month
      let projectedZeroDate: string | null = null;
      if (pace > 0 && remaining > 0) {
        const monthsToZero = remaining / pace;
        const projected = new Date(now);
        projected.setMonth(projected.getMonth() + Math.round(monthsToZero));
        projectedZeroDate = projected.toISOString().slice(0, 10);
      }

      return {
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
        leaveScore: {
          value: leaveScoreValue,
          tier: leaveScoreTier,
          freqPerMonth: +freqPerMonth.toFixed(2),
          avgDuration: +avgDuration.toFixed(2),
        },
        leaveBalance: {
          entitlement: ENTITLEMENT,
          usedYTD,
          remaining: +remaining.toFixed(1),
          projectedZeroDate,
          overQuota: usedYTD > ENTITLEMENT,
        },
      };
    }).sort((a, b) => b.totalDays - a.totalDays);

    // Filter options for the UI
    const availableCompanies = Array.from(new Set(allRows.map(r => r.company || '—'))).sort();
    const availableTypes = Array.from(new Set(allRows.map(r => normalizeVacationType(r.type || '')))).filter(Boolean).sort();

    // The current "view" — what the user has filtered to by status
    const inViewCount = statusFilter === 'all' ? filteredAll.length : filteredAll.filter(matchStatus).length;

    return NextResponse.json({
      meta: {
        statusFilter,
        totalRequests: inViewCount,
        totalAllRequests: allRows.length,
        generatedAt: new Date().toISOString(),
        filterRange: { from: filterFrom.toISOString().slice(0, 10), to: filterTo.toISOString().slice(0, 10) },
        dateRange: allRows.length ? {
          earliest: Math.min(...allRows.map(r => new Date(toIsoDate(r.createdAt) || 0).getTime())),
          latest: Math.max(...allRows.map(r => new Date(toIsoDate(r.createdAt) || 0).getTime())),
        } : undefined,
      },

      filterOptions: {
        companies: availableCompanies,
        types: availableTypes,
        statuses: ['approved', 'pending', 'denied', 'cancelled', 'all'],
      },

      // Zone 1 — Now (operational)
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

      coverageTimeline,

      // Zone 2 — Patterns
      seasonality,
      companyTypeBreakdown,
      approvalPerf,
      dayOfWeekHeatmap,

      // Zone 3 — Employees
      employees,
    });

  } catch (error) {
    console.error('❌ Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
