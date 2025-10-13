export type AdminAccess = 'ALL' | 'READ_ONLY';

export const ADMINS: { email: string; access: AdminAccess }[] = [
  { email: 'Pierre@stars.mc', access: 'ALL' },
  { email: 'johnny@stars.mc', access: 'ALL' },
  { email: 'daniel@stars.mc', access: 'ALL' },
  { email: 'compta@stars.mc', access: 'READ_ONLY' },
];

// Utility
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.some(a => a.email.toLowerCase() === email.toLowerCase());
}

export function isReadOnlyAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.some(a => a.email.toLowerCase() === email.toLowerCase() && a.access === 'READ_ONLY');
}

export function isFullAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.some(a => a.email.toLowerCase() === email.toLowerCase() && a.access === 'ALL');
}









