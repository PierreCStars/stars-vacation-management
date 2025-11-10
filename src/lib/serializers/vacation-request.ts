import { VacationRequest } from '@/types/vacation';
import { isAdmin } from '@/config/admins';

/**
 * Public DTO for vacation requests - excludes reason field for non-admins
 */
export type VacationRequestPublicDTO = Omit<VacationRequest, 'reason'>;

/**
 * Admin DTO for vacation requests - includes reason field
 */
export type VacationRequestAdminDTO = VacationRequest;

/**
 * Serializes a vacation request for a specific user.
 * For admins: includes all fields including reason
 * For non-admins: excludes the reason field
 * 
 * @param userEmail - The email of the user requesting the data
 * @param request - The vacation request to serialize
 * @returns Serialized vacation request (public or admin DTO)
 */
export function serializeVacationRequestFor(
  userEmail: string | null | undefined,
  request: VacationRequest
): VacationRequestPublicDTO | VacationRequestAdminDTO {
  const base: VacationRequestPublicDTO = {
    id: request.id,
    userId: request.userId,
    userEmail: request.userEmail,
    userName: request.userName,
    startDate: request.startDate,
    endDate: request.endDate,
    company: request.company,
    type: request.type,
    status: request.status,
    createdAt: request.createdAt,
    reviewedBy: request.reviewedBy,
    reviewerEmail: request.reviewerEmail,
    reviewedAt: request.reviewedAt,
    adminComment: request.adminComment,
    denialReason: request.denialReason,
    included: request.included,
    openDays: request.openDays,
    isHalfDay: request.isHalfDay,
    halfDayType: request.halfDayType,
    durationDays: request.durationDays,
    googleEventId: request.googleEventId,
  };

  // Only include reason field for admins
  if (isAdmin(userEmail)) {
    return {
      ...base,
      reason: request.reason ?? null,
    } as VacationRequestAdminDTO;
  }

  return base;
}

/**
 * Serializes an array of vacation requests for a specific user.
 * 
 * @param userEmail - The email of the user requesting the data
 * @param requests - Array of vacation requests to serialize
 * @returns Array of serialized vacation requests
 */
export function serializeVacationRequestsFor(
  userEmail: string | null | undefined,
  requests: VacationRequest[]
): (VacationRequestPublicDTO | VacationRequestAdminDTO)[] {
  return requests.map(request => serializeVacationRequestFor(userEmail, request));
}

