export type AdminAccess = 'ALL';

export const ADMINS: { email: string; access: AdminAccess }[] = [
  { email: 'Pierre@stars.mc', access: 'ALL' },
];

// Utility
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.some(a => a.email.toLowerCase() === email.toLowerCase());
}









