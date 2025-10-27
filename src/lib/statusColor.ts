/**
 * Single source of truth for vacation request status colors
 * Colors are applied to calendar events based on status
 */

export const VACATION_STATUS_COLOR = {
  VALIDATED: '#5af542',  // Green - approved/granted vacations
  PENDING:   '#f59b42',  // Orange - pending requests
  CONFLICT:  '#c92b12',  // Red - conflicts (overrides other statuses)
} as const;

export type StatusColorType = keyof typeof VACATION_STATUS_COLOR;

/**
 * Get the appropriate color for a vacation request based on status and conflict state
 */
export function getStatusColor(status: string, hasConflict: boolean = false): string {
  // Conflicts always take priority and show in red
  if (hasConflict) {
    return VACATION_STATUS_COLOR.CONFLICT;
  }
  
  // Map status to color
  const normalizedStatus = status?.toLowerCase() || '';
  
  switch (normalizedStatus) {
    case 'approved':
    case 'granted':
      return VACATION_STATUS_COLOR.VALIDATED;
    case 'pending':
      return VACATION_STATUS_COLOR.PENDING;
    case 'denied':
    case 'rejected':
      // Rejected should not appear in calendars, but if it does, use gray
      return '#9ca3af';
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Check if a request has a conflict (overlapping with another request from the same employee)
 */
export function detectConflictsForEmployee(
  employeeId: string,
  startDate: string,
  endDate: string,
  allRequests: Array<{ id: string; userId: string; startDate: string; endDate: string }>
): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return allRequests.some(req => {
    // Skip comparing with itself
    if (req.userId === employeeId && req.startDate === startDate && req.endDate === endDate) {
      return false;
    }
    
    // Only check conflicts with the same employee
    if (req.userId !== employeeId) {
      return false;
    }
    
    const reqStart = new Date(req.startDate);
    const reqEnd = new Date(req.endDate);
    
    // Check for overlap: ranges overlap if start1 <= end2 AND start2 <= end1
    // Using <= to include touching dates (e.g., vacation ends Dec 5, another starts Dec 5)
    // This catches edge cases where boundaries touch
    return start <= reqEnd && reqStart <= end;
  });
}

