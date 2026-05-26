// Shared types for the analytics screen — mirrors the API payload.

export type AnalyticsStatus = 'approved' | 'pending' | 'denied' | 'cancelled' | 'all';

export type EmployeeRow = {
  userId?: string;
  userEmail?: string;
  userName: string;
  company: string;
  totalDays: number;
  count: number;
  avg: number;
  lastRequestDate?: string;
  firstRequestDate?: string;
  statusCounts: { approved: number; pending: number; denied: number; cancelled: number };
  monthlySparkline: Array<{ month: string; days: number }>;
  leaveScore: {
    value: number;                       // 0..100
    tier: 'low' | 'medium' | 'high';
    freqPerMonth: number;                // sub-factor (transparency)
    avgDuration: number;                 // sub-factor (transparency)
  };
  leaveBalance: {
    entitlement: number;
    usedYTD: number;
    remaining: number;
    projectedZeroDate: string | null;
    overQuota: boolean;
  };
};

export type AwayPerson = {
  userName: string;
  company: string;
  type?: string;
  returnDate?: string;
  days?: number;
};

export type PendingItem = {
  id: string;
  userName: string;
  company: string;
  startDate?: string;
  ageDays: number;
};

export type CoverageEmployee = {
  userName: string;
  company: string;
  leaves: Array<{ start: string; end: string; status: string; type: string }>;
};

export type SeasonalityPoint = { month: string; days: number; count: number };

export type CompanyBreakdownRow = {
  company: string;
  totalCount: number;
  totalDays: number;
  types: Record<string, { count: number; days: number }>;
};

export type AnalyticsPayload = {
  meta: {
    statusFilter: string;
    totalRequests: number;
    totalAllRequests: number;
    generatedAt: string;
    filterRange: { from: string; to: string };
  };
  filterOptions: { companies: string[]; types: string[]; statuses: AnalyticsStatus[] };
  now: {
    currentlyAway: { count: number; list: AwayPerson[] };
    returningThisWeek: { count: number; list: AwayPerson[] };
    pendingApprovals: { count: number; oldestAgeDays: number; list: PendingItem[] };
    daysApprovedYTD: { total: number; prevYearTotal: number; deltaPct: number | null };
  };
  coverageTimeline: {
    from: string;
    to: string;
    employees: CoverageEmployee[];
  };
  seasonality: {
    currentYear: { year: number; series: SeasonalityPoint[] };
    previousYear: { year: number; series: SeasonalityPoint[] };
  };
  companyTypeBreakdown: CompanyBreakdownRow[];
  approvalPerf: {
    totalReviewed: number;
    approvedPct: number;
    deniedPct: number;
    avgApprovalHours: number | null;
  };
  dayOfWeekHeatmap: {
    from: string;
    to: string;
    maxCellValue: number;
    weeks: Array<{ weekStart: string; days: number[] }>; // days[0..6] = Mon..Sun person-days
  };
  employees: EmployeeRow[];
};

// Type color palette (SLG-aligned)
export const TYPE_COLORS: Record<string, string> = {
  'Paid leave':            '#1F6E3A', // elegant green
  'Unpaid leave':          '#7F94A9', // muted slate
  'Family event leave':    '#D8B11B', // gold
  'Overtime compensation': '#273341', // dark slate
  'Half day':              '#C49E15', // dark gold
  'Full day':              '#1F6E3A',
};

export function colorForType(t: string): string {
  return TYPE_COLORS[t] || '#4A4A4A';
}
