export type VacationEmail =
  | { type: 'REQUEST_SUBMITTED'; to: string; cc?: string[]; requestId: string }
  | { type: 'ADMIN_NOTIFY'; to: string[]; requestId: string }
  | { type: 'REQUEST_DECISION'; to: string; requestId: string; decision: 'APPROVED' | 'DENIED' };

export interface EmailAdapter {
  send(msg: VacationEmail): Promise<void>;
}







