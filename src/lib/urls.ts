/**
 * URL generation utilities for the vacation management app
 */

export function getBaseUrl(): string {
  // Priority: APP_BASE_URL > NEXTAUTH_URL > VERCEL_URL > localhost fallback
  const appBaseUrl = process.env.APP_BASE_URL;
  if (appBaseUrl) {
    return appBaseUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    return nextAuthUrl.replace(/\/$/, '');
  }
  
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }
  
  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  throw new Error('No base URL configured. Please set APP_BASE_URL, NEXTAUTH_URL, or VERCEL_URL');
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

