import { getAllVacationRequests } from './firebase';
import { calculateVacationDuration, formatDuration } from './duration-calculator';

export interface CSVRow {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  startDate: string;
  endDate: string;
  reason: string;
  company: string;
  type: string;
  status: string;
  createdAt: string;
  reviewedBy: string;
  reviewerEmail: string;
  reviewedAt: string;
  adminComment: string;
  durationDays?: number;  // Add duration field
  isHalfDay?: boolean;    // Add half-day flag
}

/**
 * Calculate duration using the single source of truth
 * 
 * CRITICAL: This function uses calculateVacationDuration which preserves
 * fractional values (0.5, 1.5, etc.) and never rounds or truncates.
 */
function calculateDuration(request: any): number {
  return calculateVacationDuration({
    durationDays: request.durationDays,
    isHalfDay: request.isHalfDay,
    halfDayType: request.halfDayType,
    startDate: request.startDate,
    endDate: request.endDate
  });
}

export function generateCSVContent(requests: CSVRow[]): string {
  // Define CSV headers (add Duration Days column)
  const headers = [
    'ID',
    'User ID',
    'User Email',
    'User Name',
    'Start Date',
    'End Date',
    'Duration Days',
    'Reason',
    'Company',
    'Type',
    'Status',
    'Created At',
    'Reviewed By',
    'Reviewer Email',
    'Reviewed At',
    'Admin Comment'
  ];

  // Convert data to CSV format
  const csvRows = [headers.join(',')];
  
  for (const request of requests) {
    const duration = calculateDuration(request);
    const row = [
      request.id,
      request.userId,
      request.userEmail,
      `"${request.userName.replace(/"/g, '""')}"`, // Escape quotes in names
      request.startDate,
      request.endDate,
      duration.toString(), // Include duration (preserves 0.5, 1.5, etc. - no rounding)
      `"${(request.reason || '').replace(/"/g, '""')}"`, // Escape quotes in reasons
      request.company,
      request.type,
      request.status,
      request.createdAt,
      request.reviewedBy,
      request.reviewerEmail,
      request.reviewedAt,
      `"${(request.adminComment || '').replace(/"/g, '""')}"` // Escape quotes in comments
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

// Helper function to check if a vacation overlaps with a date range
function vacationOverlapsMonth(vacation: any, monthStart: string, monthEnd: string): boolean {
  const vacStart = vacation.startDate || "";
  const vacEnd = vacation.endDate || vacation.startDate || "";
  
  // Vacation overlaps if:
  // - It starts in the month, OR
  // - It ends in the month, OR
  // - It spans the entire month (starts before and ends after)
  return (vacStart >= monthStart && vacStart <= monthEnd) ||
         (vacEnd >= monthStart && vacEnd <= monthEnd) ||
         (vacStart <= monthStart && vacEnd >= monthEnd);
}

export async function getReviewedRequestsForMonth(year: number, month: number): Promise<CSVRow[]> {
  try {
    console.log(`📊 Fetching reviewed requests for ${year}-${month.toString().padStart(2, '0')}...`);
    
    const allRequests = await getAllVacationRequests();
    
    // Calculate month date range (first and last day of month)
    const monthStart = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate(); // 0 = last day of previous month
    const monthEnd = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    // Filter for approved/validated requests that overlap with the specified month
    // Use vacation date range (not reviewedAt date) to match monthly summary logic
    const reviewedRequests = allRequests.filter((request: any) => {
      // Only include approved/validated requests (exclude pending/rejected)
      const status = (request.status || "").toLowerCase();
      if (status === 'pending' || status === 'rejected' || status === 'denied') {
        return false;
      }
      
      // Check if vacation overlaps with the month (by vacation dates, not review date)
      return vacationOverlapsMonth(request, monthStart, monthEnd);
    });

    console.log(`✅ Found ${reviewedRequests.length} reviewed requests for ${year}-${month.toString().padStart(2, '0')} (filtered by vacation date range)`);
    
    return reviewedRequests.map((request: any) => ({
      id: request.id || '',
      userId: request.userId,
      userEmail: request.userEmail,
      userName: request.userName,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason || '',
      company: request.company,
      type: request.type,
      status: request.status,
      createdAt: request.createdAt,
      reviewedBy: request.reviewedBy || '',
      reviewerEmail: request.reviewerEmail || '',
      reviewedAt: request.reviewedAt || '',
      adminComment: request.adminComment || '',
      durationDays: request.durationDays,  // Include durationDays
      isHalfDay: request.isHalfDay        // Include isHalfDay
    }));
  } catch (error) {
    console.error('❌ Error fetching reviewed requests for CSV export:', error);
    throw error;
  }
}

export function getMonthName(month: number): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
}

export function isLastDayOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return tomorrow.getDate() === 1;
} 