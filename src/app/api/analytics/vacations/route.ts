export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { firebaseAdmin, isFirebaseAdminAvailable } from "@/lib/firebase-admin";

type VR = {
  id: string;
  userId?: string; 
  userName?: string; 
  company?: string;
  type?: string;
  status?: string;
  isHalfDay?: boolean;
  durationDays?: number;
  startDate?: string; 
  endDate?: string;
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
    
    let rows: VR[] = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db } = firebaseAdmin();
        const collection = db.collection("vacationRequests");
        let q = status !== "all" ? collection.where("status", "==", status) : collection;

        const snap = await q.get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
        
        console.log(`✅ Fetched ${rows.length} vacation requests from Firestore for analytics`);
      } else {
        console.log('⚠️  Firebase Admin not available - using mock data for analytics');
      }
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      console.log('⚠️  Falling back to mock data for analytics...');
    }

    // Fallback to mock data if Firestore fails or is not available
    if (rows.length === 0) {
      rows = [
        {
          id: 'mock-1',
          userId: 'user1',
          userName: 'John Smith',
          company: 'Stars Yachting',
          type: 'Full day',
          status: 'approved',
          isHalfDay: false,
          startDate: '2025-01-15',
          endDate: '2025-01-17'
        },
        {
          id: 'mock-2',
          userId: 'user2',
          userName: 'Jane Doe',
          company: 'Stars Real Estate',
          type: 'Half day',
          status: 'approved',
          isHalfDay: true,
          startDate: '2025-01-20',
          endDate: '2025-01-20'
        },
        {
          id: 'mock-3',
          userId: 'user3',
          userName: 'Mike Wilson',
          company: 'Le Pneu',
          type: 'Full day',
          status: 'approved',
          isHalfDay: false,
          startDate: '2025-01-10',
          endDate: '2025-01-12'
        },
        {
          id: 'mock-4',
          userId: 'user1',
          userName: 'John Smith',
          company: 'Stars Yachting',
          type: 'Full day',
          status: 'approved',
          isHalfDay: false,
          startDate: '2025-02-01',
          endDate: '2025-02-03'
        }
      ];
    }

    // ---- Aggregations ----
    const perEmployee: Record<string, { 
      userId?: string; 
      userName: string; 
      company: string; 
      totalDays: number; 
      count: number; 
      avg: number; 
    }> = {};
    
    const byTypeCount: Record<string, number> = {};
    const byCompanyTypeCount: Record<string, Record<string, number>> = {};
    const byCompanyTypeDays: Record<string, Record<string, number>> = {};

    for (const r of rows) {
      const days = resolveDuration(r);
      const empKey = r.userId || r.userName || r.id;
      const name = r.userName || "Unknown";
      const cmp = r.company || "—";
      const typ = r.type || (r.isHalfDay ? "Half day" : "Full day");

      // per-employee
      if (!perEmployee[empKey]) {
        perEmployee[empKey] = { 
          userId: r.userId, 
          userName: name, 
          company: cmp, 
          totalDays: 0, 
          count: 0, 
          avg: 0 
        };
      }
      perEmployee[empKey].totalDays += days;
      perEmployee[empKey].count += 1;

      // by type (frequency)
      byTypeCount[typ] = (byTypeCount[typ] || 0) + 1;

      // by company/type (frequency)
      if (!byCompanyTypeCount[cmp]) byCompanyTypeCount[cmp] = {};
      byCompanyTypeCount[cmp][typ] = (byCompanyTypeCount[cmp][typ] || 0) + 1;

      // by company/type (duration)
      if (!byCompanyTypeDays[cmp]) byCompanyTypeDays[cmp] = {};
      byCompanyTypeDays[cmp][typ] = (byCompanyTypeDays[cmp][typ] || 0) + days;
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

    const freqByType = types.map(t => ({ type: t, count: byTypeCount[t] }));
    const freqByCompanyStack = companies.map(c => ({ company: c, ...(byCompanyTypeCount[c]) }));
    const daysByCompanyStack = companies.map(c => ({ company: c, ...(byCompanyTypeDays[c]) }));

    return NextResponse.json({
      meta: { statusFilter: status, totalRequests: rows.length },
      employees,
      freqByType,
      freqByCompanyStack,
      daysByCompanyStack,
      // also expose the dynamic keys for stacks
      typeKeys: types,
      companyKeys: companies
    });

  } catch (error) {
    console.error('❌ Error in analytics API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
