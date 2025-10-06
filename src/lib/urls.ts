/**
 * URL generation utilities for the vacation management app
 */

export function getBaseUrl(): string {
  const explicit =
    process.env.APP_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.PUBLIC_APP_BASE_URL; // optional client-side fallback
  if (explicit) {
    const url = explicit.replace(/\/$/, '');
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  const v = process.env.VERCEL_URL; // bare host like my-app.vercel.app
  if (v) {
    const url = v.startsWith('http') ? v : `https://${v}`;
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  // For local dev, do NOT hardcode localhost in code. Call sites should allow relative URLs.
  return '';
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  return base ? `${base}${path.startsWith('/') ? path : '/' + path}` : path;
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

