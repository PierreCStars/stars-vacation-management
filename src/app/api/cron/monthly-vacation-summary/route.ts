export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { firebaseAdmin, isFirebaseAdminAvailable } from "@/lib/firebase-admin";

type VR = {
  id: string;
  userName?: string; 
  company?: string; 
  type?: string;
  status?: string;
  isHalfDay?: boolean; 
  durationDays?: number;
  startDate?: string; 
  endDate?: string;
  createdAt?: any; 
  reviewedAt?: any;
};

function firstAndLastOfPrevMonth(tz = "Europe/Monaco") {
  // Compute in local TZ roughly by date arithmetic on UTC; acceptable for monthly ranges.
  const now = new Date();
  const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)); // day 0 of current month
  const yyyy = first.getUTCFullYear();
  const mm = String(first.getUTCMonth() + 1).padStart(2, "0");
  const dd1 = "01";
  const ddL = String(last.getUTCDate()).padStart(2, "0");
  return {
    startISO: `${yyyy}-${mm}-${dd1}`,
    endISO: `${yyyy}-${mm}-${ddL}`,
    label: `${yyyy}-${mm}`
  };
}

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
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

// Simple email function using environment variables
async function sendEmail(subject: string, html: string, csvContent: string, filename: string) {
  // For now, we'll log the email details since we don't have a mailer configured
  // In production, you would use nodemailer or similar
  console.log('📧 Monthly Summary Email would be sent:');
  console.log('Subject:', subject);
  console.log('HTML:', html);
  console.log('CSV Filename:', filename);
  console.log('CSV Content Length:', csvContent.length);
  
  // TODO: Implement actual email sending using your preferred email service
  // Example with nodemailer:
  // const transporter = nodemailer.createTransporter({
  //   host: process.env.SMTP_HOST,
  //   port: parseInt(process.env.SMTP_PORT || '587'),
  //   secure: false,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS
  //   }
  // });
  
  // await transporter.sendMail({
  //   from: `"Stars Vacation" <${process.env.SMTP_USER}>`,
  //   to: process.env.ADMIN_EMAILS?.split(',') || ['admin@stars.mc'],
  //   subject,
  //   html,
  //   attachments: [{
  //     filename,
  //     content: csvContent,
  //     contentType: "text/csv"
  //   }]
  // });
}

export async function GET(req: Request) {
  try {
    // Only send on the last day of month (Europe/Monaco)
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    
    if (now.getDate() !== lastDay) {
      return NextResponse.json({ 
        ok: true, 
        skipped: true, 
        reason: "Not last day of month",
        currentDate: now.toISOString(),
        lastDayOfMonth: lastDay
      });
    }

    const { startISO, endISO, label } = firstAndLastOfPrevMonth();
    console.log(`📅 Processing monthly summary for ${label} (${startISO} to ${endISO})`);

    let all: VR[] = [];
    
    // Try to fetch from Firestore first
    try {
      if (isFirebaseAdminAvailable()) {
        const { db, error } = await firebaseAdmin();
        
        if (db && !error) {
          // Pull approved/rejected requests whose startDate is in prev month
          const snap = await db.collection("vacationRequests")
            .where("status", "in", ["approved", "denied"])
            .get();

          all = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
          console.log(`✅ Fetched ${all.length} approved/rejected requests from Firestore`);
        } else {
          console.log('⚠️  Firebase Admin not available - using mock data for monthly summary:', error);
        }
      } else {
        console.log('⚠️  Firebase Admin not available - using mock data for monthly summary');
      }
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      console.log('⚠️  Falling back to mock data for monthly summary...');
    }

    // No mock data fallback - Firebase only

    // Filter requests in the date range
    const inRange = all.filter(r => {
      const s = r.startDate || "";
      return s >= startISO && s <= endISO;
    });

    console.log(`📊 Found ${inRange.length} requests in range ${startISO} to ${endISO}`);

    const flat = inRange.map(r => ({
      employee: r.userName || "Unknown",
      company: r.company || "—",
      type: r.type || (r.isHalfDay ? "Half day" : "Full day"),
      status: r.status || "",
      startDate: r.startDate || "",
      endDate: r.endDate || r.startDate || "",
      days: resolveDuration(r)
    }));

    const approved = flat.filter(r => r.status === "approved");
    const rejected = flat.filter(r => r.status === "denied");
    const totalDays = approved.reduce((s, r) => s + Number(r.days || 0), 0);

    // Build email
    const subject = `📅 Monthly Vacation Summary — ${label} (Approved & Rejected)`;
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif">
        <h2 style="margin:0 0 8px">Monthly Vacation Summary — ${label}</h2>
        <p><b>Approved:</b> ${approved.length} requests — ${totalDays.toFixed(1)} days</p>
        <p><b>Rejected:</b> ${rejected.length} requests</p>
        <p>The detailed CSV is attached.</p>
      </div>
    `;
    
    const csv = toCSV(flat);
    const filename = `vacations_${label}.csv`;

    // Send email
    await sendEmail(subject, html, csv, filename);

    console.log(`✅ Monthly summary processed successfully for ${label}`);
    console.log(`   - Approved: ${approved.length} requests (${totalDays.toFixed(1)} days)`);
    console.log(`   - Rejected: ${rejected.length} requests`);

    return NextResponse.json({ 
      ok: true, 
      month: label, 
      approved: approved.length, 
      rejected: rejected.length,
      totalDays: totalDays.toFixed(1),
      dateRange: { start: startISO, end: endISO }
    });

  } catch (error) {
    console.error('❌ Error in monthly summary API:', error);
    return NextResponse.json(
      { error: 'Failed to process monthly summary' },
      { status: 500 }
    );
  }
}
