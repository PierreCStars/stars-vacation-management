/**
 * Shared Helper for Monthly Vacation Summary
 * 
 * This module provides a single source of truth for:
 * - Calculating month boundaries in Monaco timezone
 * - Fetching validated vacations for a month
 * - Calculating totals (preserving fractional days)
 * 
 * Used by both email summary and CSV export to ensure consistency.
 */

import { calculateVacationDuration, sumDurations } from './duration-calculator';
import { isFirebaseAdminAvailable, firebaseAdmin } from './firebase-admin';

export interface VacationRow {
  employee: string;
  company: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  days: number;
  id?: string;
  userName?: string;
  userId?: string;
  userEmail?: string;
  durationDays?: number;
  isHalfDay?: boolean;
}

export interface MonthRange {
  startISO: string;
  endISO: string;
  label: string;
  displayLabel: string;
}

export interface MonthlyTotals {
  totalDays: number;
  perEmployeeTotals: Map<string, { totalDays: number; requestCount: number }>;
}

/**
 * Calculate month boundaries in Monaco timezone
 * 
 * CRITICAL: This function uses Europe/Monaco timezone to correctly determine
 * month boundaries. This ensures that vacations at month boundaries are
 * correctly assigned to the right month.
 * 
 * @param tz Timezone (defaults to "Europe/Monaco")
 * @returns Month range with startISO, endISO, label (YYYY-MM), and displayLabel (Month YYYY)
 */
export function getMonthRangeInTimezone(tz = "Europe/Monaco"): MonthRange {
  // Get current date/time
  const now = new Date();
  
  // Format date in Monaco timezone to get correct month/day
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    calendar: 'gregory'
  });
  
  // Get Monaco-local date parts
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value);
  
  // Calculate last day of month using Monaco timezone
  // Create a date for the first day of next month, then subtract 1 day
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  
  // Create date string for first day of next month in Monaco timezone
  const nextMonthFirst = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00`;
  
  // Use Intl.DateTimeFormat to get the last day of current month
  // by formatting the day before the first of next month
  const tempDate = new Date(nextMonthFirst);
  tempDate.setDate(tempDate.getDate() - 1);
  
  const lastDayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    day: '2-digit'
  });
  const lastDay = parseInt(lastDayFormatter.format(tempDate));
  
  // Format as ISO dates (YYYY-MM-DD)
  const startISO = `${year}-${String(month).padStart(2, '0')}-01`;
  const endISO = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  const label = `${year}-${String(month).padStart(2, '0')}`;
  
  // Generate display label (e.g., "January 2025")
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const displayLabel = `${monthNames[month - 1]} ${year}`;
  
  return { startISO, endISO, label, displayLabel };
}

/**
 * Check if a vacation overlaps with a date range
 * 
 * @param vacation Vacation request object
 * @param monthStart Start date (YYYY-MM-DD)
 * @param monthEnd End date (YYYY-MM-DD)
 * @returns true if vacation overlaps with the month
 */
export function vacationOverlapsMonth(
  vacation: { startDate?: string; endDate?: string },
  monthStart: string,
  monthEnd: string
): boolean {
  const vacStart = vacation.startDate || "";
  const vacEnd = vacation.endDate || vacation.startDate || "";
  
  if (!vacStart) return false;
  
  // Vacation overlaps if:
  // - It starts in the month, OR
  // - It ends in the month, OR
  // - It spans the entire month (starts before and ends after)
  return (vacStart >= monthStart && vacStart <= monthEnd) ||
         (vacEnd >= monthStart && vacEnd <= monthEnd) ||
         (vacStart <= monthStart && vacEnd >= monthEnd);
}

/**
 * Get all validated vacation requests for a month
 * 
 * CRITICAL: This function preserves ALL requests, including multiple per employee.
 * It uses filter() + map() to ensure no deduplication occurs.
 * 
 * @param startISO Start date of month (YYYY-MM-DD)
 * @param endISO End date of month (YYYY-MM-DD)
 * @returns Array of vacation rows (one per request)
 */
export async function getValidatedVacationsForMonth(
  startISO: string,
  endISO: string
): Promise<VacationRow[]> {
  let all: any[] = [];
  
  // Fetch from Firestore
  try {
    if (isFirebaseAdminAvailable()) {
      const { db, error } = await firebaseAdmin();
      
      if (db && !error) {
        // CRITICAL: Fetch ALL vacation requests, then filter by status in code
        // This ensures we don't miss any vacations due to status value variations
        // Firestore's "in" operator might miss variations like "Approved", "APPROVED", etc.
        const snap = await db.collection("vacationRequests").get();

        all = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
        console.log(`✅ Fetched ${all.length} total vacation requests from Firestore`);
        
        // Log status distribution to help diagnose
        const statusCounts = new Map<string, number>();
        all.forEach(r => {
          const status = (r.status || "unknown").toLowerCase();
          statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
        });
        console.log(`📊 Status distribution:`, Object.fromEntries(statusCounts));
        
        // Filter to only approved/validated requests (case-insensitive)
        // This catches all variations: "approved", "APPROVED", "Approved", "validated", "Validated", etc.
        const approvedStatuses = ["approved", "validated"];
        all = all.filter(r => {
          const status = (r.status || "").toLowerCase();
          return approvedStatuses.includes(status);
        });
        console.log(`✅ Filtered to ${all.length} approved/validated requests (case-insensitive)`);
      } else {
        console.error('⚠️ Firebase Admin not available:', error);
        throw new Error('Firebase Admin not available');
      }
    } else {
      console.error('⚠️ Firebase Admin not available');
      throw new Error('Firebase Admin not available');
    }
  } catch (firebaseError) {
    console.error('❌ Firebase error:', firebaseError);
    throw new Error('Failed to fetch vacation requests');
  }

  // Filter requests that overlap with the month
  const inRange = all.filter(r => vacationOverlapsMonth(r, startISO, endISO));

  console.log(`📊 Found ${inRange.length} requests overlapping with ${startISO} to ${endISO}`);
  
  // Safeguard: Log employee distribution to verify no deduplication
  const employeeCounts = new Map<string, number>();
  inRange.forEach(r => {
    const emp = r.userName || "Unknown";
    employeeCounts.set(emp, (employeeCounts.get(emp) || 0) + 1);
  });
  console.log(`👥 Employee request counts:`, Object.fromEntries(employeeCounts));
  const employeesWithMultiple = Array.from(employeeCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([emp, count]) => `${emp}: ${count}`);
  if (employeesWithMultiple.length > 0) {
    console.log(`✅ Employees with multiple requests: ${employeesWithMultiple.join(', ')}`);
  }

  // CRITICAL: Use map() to preserve ALL entries - one row per request
  // Do NOT use reduce() or Map that would collapse multiple requests per employee
  const flat = inRange.map(r => {
    const isHalfDay = r.isHalfDay === true;
    const duration = calculateVacationDuration({
      durationDays: r.durationDays,
      isHalfDay: r.isHalfDay,
      halfDayType: r.halfDayType,
      startDate: r.startDate,
      endDate: r.endDate
    });
    
    console.log(`📋 Processing vacation: ${r.userName}, isHalfDay: ${r.isHalfDay}, durationDays: ${r.durationDays}, resolved duration: ${duration}, status: ${r.status}`);
    
    return {
      id: r.id,
      employee: r.userName || "Unknown",
      company: r.company || "—",
      type: r.type || (isHalfDay ? "Half day" : "Full day"),
      status: r.status || "",
      startDate: r.startDate || "",
      endDate: r.endDate || r.startDate || "",
      days: duration,
      userName: r.userName,
      userId: r.userId,
      userEmail: r.userEmail,
      durationDays: r.durationDays,
      isHalfDay: r.isHalfDay
    };
  });

  // Filter only approved/validated vacations (exclude rejected)
  // CRITICAL: Use filter() to preserve ALL entries - do NOT deduplicate by employee
  const approved = flat.filter(r => {
    const status = (r.status || "").toLowerCase();
    return status === "approved" || status === "validated";
  });
  
  console.log(`✅ Filtered to ${approved.length} approved/validated vacations`);
  
  // Safeguard: Verify we still have all requests (no deduplication)
  const approvedEmployeeCounts = new Map<string, number>();
  approved.forEach(r => {
    const emp = r.employee || "Unknown";
    approvedEmployeeCounts.set(emp, (approvedEmployeeCounts.get(emp) || 0) + 1);
  });
  console.log(`👥 Approved employee request counts:`, Object.fromEntries(approvedEmployeeCounts));
  const approvedWithMultiple = Array.from(approvedEmployeeCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([emp, count]) => `${emp}: ${count}`);
  if (approvedWithMultiple.length > 0) {
    console.log(`✅ Approved employees with multiple requests: ${approvedWithMultiple.join(', ')}`);
  }
  
  return approved;
}

/**
 * Calculate totals from vacation rows
 * 
 * CRITICAL: This function preserves fractional values (0.5, 1.5, etc.)
 * and calculates per-employee totals to verify multiple requests are summed correctly.
 * 
 * @param rows Array of vacation rows
 * @returns Totals including overall total and per-employee breakdown
 */
export function calculateTotals(rows: VacationRow[]): MonthlyTotals {
  // Sum all durations (preserves fractional values)
  const totalDays = sumDurations(rows.map(r => r.days || 0));
  
  // Calculate per-employee totals
  const perEmployeeTotals = new Map<string, { totalDays: number; requestCount: number }>();
  rows.forEach(r => {
    const emp = r.employee || "Unknown";
    const current = perEmployeeTotals.get(emp) || { totalDays: 0, requestCount: 0 };
    perEmployeeTotals.set(emp, {
      totalDays: current.totalDays + (r.days || 0),
      requestCount: current.requestCount + 1
    });
  });
  
  // Verify that sum of per-employee totals matches overall total
  const sumOfEmployeeTotals = sumDurations(Array.from(perEmployeeTotals.values()).map(e => e.totalDays));
  if (Math.abs(sumOfEmployeeTotals - totalDays) > 0.01) {
    console.error(`❌ CRITICAL ERROR: Sum of per-employee totals (${sumOfEmployeeTotals.toFixed(1)}) does not match overall total (${totalDays.toFixed(1)})!`);
  } else {
    console.log(`✅ Verification passed: Sum of per-employee totals (${sumOfEmployeeTotals.toFixed(1)}) matches overall total (${totalDays.toFixed(1)})`);
  }
  
  // Log per-employee totals
  const employeeTotalsArray = Array.from(perEmployeeTotals.entries())
    .map(([emp, data]) => ({ employee: emp, ...data }))
    .sort((a, b) => a.employee.localeCompare(b.employee));
  
  console.log(`📊 Per-employee totals (verification that multiple requests are summed):`);
  employeeTotalsArray.forEach(({ employee, totalDays, requestCount }) => {
    if (requestCount > 1) {
      console.log(`   ✅ ${employee}: ${totalDays.toFixed(1)} days (from ${requestCount} requests)`);
    } else {
      console.log(`   ${employee}: ${totalDays.toFixed(1)} days (${requestCount} request)`);
    }
  });
  
  return { totalDays, perEmployeeTotals };
}

