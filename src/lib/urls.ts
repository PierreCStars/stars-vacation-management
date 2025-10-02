/**
 * URL generation utilities for the vacation management app
 */

export function getBaseUrl(): string {
  // Priority: APP_BASE_URL (explicit), then NEXTAUTH_URL, then VERCEL_URL
  const explicit = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '';
  if (explicit) return explicit.replace(/\/$/, '');

  // Fallback to Vercel environment var if present
  const v = process.env.VERCEL_URL; // e.g. starsvacationmanagementv2.vercel.app
  if (v && !/^https?:\/\//i.test(v)) return `https://${v}`;  // normalize
  return (v || ''); // already full URL if it starts with http
}

export function adminVacationRequestUrl(id: string, locale = 'en'): string {
  const base = getBaseUrl();
  return `${base}/${locale}/admin/vacation-requests/${id}`;
}

export function vacationRequestUrl(id: string, locale = 'en'): string {
  const base = getBaseUrl();
  return `${base}/${locale}/vacation-request/${id}`;
}

export function adminDashboardUrl(locale = 'en'): string {
  const base = getBaseUrl();
  return `${base}/${locale}/admin`;
}

export function vacationRequestFormUrl(locale = 'en'): string {
  const base = getBaseUrl();
  return `${base}/${locale}/vacation-request`;
}

