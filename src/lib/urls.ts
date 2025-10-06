/**
 * URL generation utilities for the vacation management app
 */

export function getBaseUrl(): string {
  // Priority: APP_BASE_URL (explicit), then NEXTAUTH_URL, then VERCEL_URL
  const explicit = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || '';
  if (explicit) {
    const url = explicit.replace(/\/$/, '');
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  // Fallback to Vercel environment var if present
  const v = process.env.VERCEL_URL; // e.g. starsvacationmanagementv2.vercel.app
  if (v) {
    const url = v.startsWith('http') ? v : `https://${v}`;
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }
  
  // Final fallback to canonical domain
  return 'https://starsvacationmanagementv2.vercel.app';
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

