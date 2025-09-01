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
    
    let rows: VR[] = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db } = firebaseAdmin();
        const collection = db.collection("vacationRequests");
        let q = status !== "all" ? collection.where("status", "==", status) : collection;
        const snap = await q.get();
        rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
        
        console.log(`✅ Fetched ${rows.length} vacation requests for CSV export (status: ${status})`);
      } else {
        console.log('⚠️  Firebase Admin not available - using mock data for CSV export');
      }
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      console.log('⚠️  Falling back to mock data for CSV export...');
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
        }
      ];
    }

    const flat = rows.map(r => ({
      employee: r.userName || "Unknown",
      company: r.company || "—",
      type: r.type || (r.isHalfDay ? "Half day" : "Full day"),
      status: r.status || "",
      startDate: r.startDate || "",
      endDate: r.endDate || r.startDate || "",
      days: resolveDuration(r)
    }));

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
