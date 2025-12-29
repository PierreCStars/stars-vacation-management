import { NextResponse } from "next/server";
import { getMonthRangeInTimezone, getValidatedVacationsForMonth } from "@/lib/monthly-vacation-helper";

/**
 * Diagnostic endpoint to inspect the exact data being used for monthly vacation summary
 * This helps debug why only one vacation per employee appears in the email
 */
export async function GET() {
  try {
    const range = getMonthRangeInTimezone("Europe/Monaco");
    const approved = await getValidatedVacationsForMonth(range.startISO, range.endISO);
    
    // Group by employee to show the issue
    const byEmployee = new Map<string, typeof approved>();
    approved.forEach(v => {
      const emp = v.employee || "Unknown";
      if (!byEmployee.has(emp)) {
        byEmployee.set(emp, []);
      }
      byEmployee.get(emp)!.push(v);
    });
    
    const employeeBreakdown = Array.from(byEmployee.entries()).map(([emp, vacations]) => ({
      employee: emp,
      requestCount: vacations.length,
      totalDays: vacations.reduce((sum, v) => sum + (v.days || 0), 0),
      vacations: vacations.map(v => ({
        id: v.id,
        startDate: v.startDate,
        endDate: v.endDate,
        days: v.days,
        type: v.type,
        status: v.status
      }))
    }));
    
    return NextResponse.json({
      ok: true,
      month: range.label,
      dateRange: { start: range.startISO, end: range.endISO },
      totalRequests: approved.length,
      totalDays: approved.reduce((sum, v) => sum + (v.days || 0), 0),
      employeeBreakdown,
      allVacations: approved.map(v => ({
        id: v.id,
        employee: v.employee,
        startDate: v.startDate,
        endDate: v.endDate,
        days: v.days,
        type: v.type,
        status: v.status
      }))
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

