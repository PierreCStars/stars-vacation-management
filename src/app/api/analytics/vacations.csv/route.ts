export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getVacationRequests } from "@/lib/analytics/data";

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

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return "employee,company,type,status,startDate,endDate,days\n";
  const headers = Object.keys(rows[0]);
  const esc = (val: any) => {
    const s = (val ?? "").toString();
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map(r => headers.map(h => esc(r[h])).join(","))
  ].join("\n");
}

export async function GET(req: Request) {
  try {
    // Handle build-time scenario where req.url might be undefined
    if (!req.url) {
      return NextResponse.json({
        error: 'Request URL not available during build time'
      }, { status: 400 });
    }

    const url = new URL(req.url);
    // status filter (default approved)
    const status = url.searchParams.get("status") || "approved";
    
    console.info('[ANALYTICS] source=firebase query=analytics-csv', { status });
    
    // Fetch data from Firebase only
    const rows = await getVacationRequests(status);

    const flat = rows.map(r => {
      // Normalize vacation types - treat both VACATION and PAID_VACATION as "Paid Vacation"
      let type = r.type || (r.isHalfDay ? "Half day" : "Full day");
      if (type === 'VACATION' || type === 'PAID_VACATION') {
        type = 'Paid Vacation';
      }
      
      return {
        employee: r.userName || "Unknown",
        company: r.company || "—",
        type,
        status: r.status || "",
        startDate: r.startDate || "",
        endDate: r.endDate || r.startDate || "",
        days: resolveDuration(r)
      };
    });

    const csv = toCSV(flat);
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="vacations_${status}_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('❌ Error in CSV export API:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV data' },
      { status: 500 }
    );
  }
}
