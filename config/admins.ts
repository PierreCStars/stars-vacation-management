export type AdminAccess = 'ALL';

export const ADMINS: { email: string; access: AdminAccess }[] = [
  { email: 'Daniel@stars.mc', access: 'ALL' },
  { email: 'Johnny@stars.mc', access: 'ALL' },
  { email: 'Compta@stars.mc', access: 'ALL' },
];

// Utility
export function isAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMINS.some(a => a.email.toLowerCase() === email.toLowerCase());
}









