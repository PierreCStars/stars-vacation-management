export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getVacationRequests } from "@/lib/analytics/data";

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
  googleEventId?: string;
};

function inclusiveDays(startISO?: string, endISO?: string) {
  if (!startISO) return 0;
  const s = new Date(startISO);
  const e = new Date(endISO || startISO);
  const ms = e.getTime() - s.getTime();
  return Math.floor(ms / (24*3600*1000)) + 1;
}

function resolveDuration(v: VR) {
  if (typeof v.durationDays === "number") return v.durationDays;
  if (v.isHalfDay) return 0.5;
  return inclusiveDays(v.startDate, v.endDate);
}

export async function GET(req: Request) {
  try {
    // Handle build-time scenario where req.url might be undefined
    if (!req.url) {
      return NextResponse.json({
        success: false,
        error: 'Request URL not available during build time',
        data: null
      }, { status: 400 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get("status") || "approved"; // default
    
    console.info('[ANALYTICS] source=firebase query=analytics-vacations', { status });
    
    // Fetch data from Firebase - no fallbacks
    console.log('🔍 Debug: About to call getVacationRequests with status:', status);
    const rows = await getVacationRequests(status);
    console.log('🔍 Debug: getVacationRequests returned:', rows.length, 'rows');

    // ---- Aggregations ----
    const perEmployee: Record<string, { 
      userId?: string; 
      userEmail?: string;
      userName: string; 
      company: string; 
      totalDays: number; 
      count: number; 
      avg: number;
      lastRequestDate?: string;
      firstRequestDate?: string;
    }> = {};
    
    const byTypeCount: Record<string, number> = {};
    const byCompanyTypeCount: Record<string, Record<string, number>> = {};
    const byCompanyTypeDays: Record<string, Record<string, number>> = {};
    const byReasonCount: Record<string, number> = {};
    const byStatusCount: Record<string, number> = {};
    const monthlyData: Record<string, { requests: number; days: number }> = {};

    for (const r of rows) {
      const days = resolveDuration(r);
      // Use userEmail as primary key, fallback to userId, then userName, then id
      const empKey = r.userEmail || r.userId || r.userName || r.id;
      const name = r.userName || "Unknown";
      const cmp = r.company || "—";
      // Normalize vacation types - treat both VACATION and PAID_VACATION as "Paid Vacation"
      let typ = r.type || (r.isHalfDay ? "Half day" : "Full day");
      if (typ === 'VACATION' || typ === 'PAID_VACATION') {
        typ = 'Paid Vacation';
      }
      
      // Convert timestamps to ISO strings for consistent handling
      const requestDate = r.createdAt ? 
        (r.createdAt.toDate ? r.createdAt.toDate().toISOString() : new Date(r.createdAt).toISOString()) : 
        new Date().toISOString();

      // per-employee
      if (!perEmployee[empKey]) {
        perEmployee[empKey] = { 
          userId: r.userId, 
          userEmail: r.userEmail,
          userName: name, 
          company: cmp, 
          totalDays: 0, 
          count: 0, 
          avg: 0,
          lastRequestDate: requestDate,
          firstRequestDate: requestDate
        };
      }
      perEmployee[empKey].totalDays += days;
      perEmployee[empKey].count += 1;
      
      // Update date range
      if (requestDate < perEmployee[empKey].firstRequestDate!) {
        perEmployee[empKey].firstRequestDate = requestDate;
      }
      if (requestDate > perEmployee[empKey].lastRequestDate!) {
        perEmployee[empKey].lastRequestDate = requestDate;
      }

      // by type (frequency)
      byTypeCount[typ] = (byTypeCount[typ] || 0) + 1;

      // by company/type (frequency)
      if (!byCompanyTypeCount[cmp]) byCompanyTypeCount[cmp] = {};
      byCompanyTypeCount[cmp][typ] = (byCompanyTypeCount[cmp][typ] || 0) + 1;

      // by company/type (duration)
      if (!byCompanyTypeDays[cmp]) byCompanyTypeDays[cmp] = {};
      byCompanyTypeDays[cmp][typ] = (byCompanyTypeDays[cmp][typ] || 0) + days;

      // by reason (frequency)
      const reason = r.reason || "No reason provided";
      byReasonCount[reason] = (byReasonCount[reason] || 0) + 1;

      // by status (frequency)
      const status = r.status || "unknown";
      byStatusCount[status] = (byStatusCount[status] || 0) + 1;

      // monthly data
      const monthKey = new Date(requestDate).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { requests: 0, days: 0 };
      }
      monthlyData[monthKey].requests += 1;
      monthlyData[monthKey].days += days;
    }

    // finalize avg
    const employees = Object.values(perEmployee).map(e => ({ 
      ...e, 
      avg: e.count ? +(e.totalDays / e.count).toFixed(2) : 0 
    }));

    // sort employees by totalDays desc by default
    employees.sort((a,b)=> b.totalDays - a.totalDays);

    // normalize charts
    const types = Object.keys(byTypeCount).sort();
    const companies = Object.keys(byCompanyTypeCount).sort();
    const reasons = Object.keys(byReasonCount).sort();
    const statuses = Object.keys(byStatusCount).sort();
    const months = Object.keys(monthlyData).sort();

    const freqByType = types.map(t => ({ type: t, count: byTypeCount[t] }));
    const freqByCompanyStack = companies.map(c => ({ company: c, ...(byCompanyTypeCount[c]) }));
    const daysByCompanyStack = companies.map(c => ({ company: c, ...(byCompanyTypeDays[c]) }));
    const freqByReason = reasons.map(r => ({ reason: r, count: byReasonCount[r] }));
    const freqByStatus = statuses.map(s => ({ status: s, count: byStatusCount[s] }));
    const monthlyTrends = months.map(m => ({ 
      month: m, 
      requests: monthlyData[m].requests, 
      days: monthlyData[m].days 
    }));

    return NextResponse.json({
      meta: { 
        statusFilter: status, 
        totalRequests: rows.length,
        dateRange: {
          earliest: Math.min(...Object.values(perEmployee).map(e => new Date(e.firstRequestDate!).getTime())),
          latest: Math.max(...Object.values(perEmployee).map(e => new Date(e.lastRequestDate!).getTime()))
        }
      },
      employees,
      freqByType,
      freqByCompanyStack,
      daysByCompanyStack,
      freqByReason,
      freqByStatus,
      monthlyTrends,
      // also expose the dynamic keys for stacks
      typeKeys: types,
      companyKeys: companies,
      reasonKeys: reasons,
      statusKeys: statuses
    });

  } catch (error) {
    console.error('❌ Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
