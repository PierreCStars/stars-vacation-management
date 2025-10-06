/**
 * Type definitions for vacation management system
 * Fields are marked as optional to surface potential undefined issues
 */

export type VacationRequest = {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  company?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  reason?: string;
  status?: 'pending' | 'approved' | 'denied' | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  reviewedAt?: string | Date;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  googleEventId?: string;
};

export type VacationRequestForm = {
  userName?: string;
  userEmail?: string;
  company?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  isHalfDay?: boolean;
  halfDayType?: 'morning' | 'afternoon' | null;
  reason?: string;
};

export type VacationRequestUpdate = {
  status: 'approved' | 'denied';
  reviewedBy: {
    id: string;
    name: string;
    email: string;
  };
  comment?: string;
};

export type VacationAnalytics = {
  totalRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalDays: number;
  averageDuration: number;
  byCompany: Record<string, {
    count: number;
    days: number;
    averageDuration: number;
  }>;
  byType: Record<string, {
    count: number;
    days: number;
    averageDuration: number;
  }>;
};
