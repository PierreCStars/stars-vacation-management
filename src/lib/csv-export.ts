import { getAllVacationRequests } from './firebase';

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
}

export function generateCSVContent(requests: CSVRow[]): string {
  // Define CSV headers
  const headers = [
    'ID',
    'User ID',
    'User Email',
    'User Name',
    'Start Date',
    'End Date',
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
    const row = [
      request.id,
      request.userId,
      request.userEmail,
      `"${request.userName.replace(/"/g, '""')}"`, // Escape quotes in names
      request.startDate,
      request.endDate,
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

export async function getReviewedRequestsForMonth(year: number, month: number): Promise<CSVRow[]> {
  try {
    console.log(`📊 Fetching reviewed requests for ${year}-${month.toString().padStart(2, '0')}...`);
    
    const allRequests = await getAllVacationRequests();
    
    // Filter for reviewed requests (not PENDING) in the specified month
    const reviewedRequests = allRequests.filter((request: any) => {
      if (request.status === 'PENDING') return false;
      
      // Check if the request was reviewed in the specified month
      if (request.reviewedAt) {
        const reviewedDate = new Date(request.reviewedAt);
        return reviewedDate.getFullYear() === year && reviewedDate.getMonth() === month - 1;
      }
      
      // If no reviewedAt date, check the createdAt date
      const createdDate = new Date(request.createdAt);
      return createdDate.getFullYear() === year && createdDate.getMonth() === month - 1;
    });

    console.log(`✅ Found ${reviewedRequests.length} reviewed requests for ${year}-${month.toString().padStart(2, '0')}`);
    
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
      adminComment: request.adminComment || ''
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