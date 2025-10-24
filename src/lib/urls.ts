/**
 * URL generation utilities for the vacation management app
 */

export function getBaseUrl(): string {
  // First check for explicit production URL override
  const productionUrl = process.env.PRODUCTION_BASE_URL || process.env.APP_BASE_URL;
  if (productionUrl) {
    const url = productionUrl.replace(/\/$/, '');
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  // Check Vercel environment variables for production
  const v = process.env.VERCEL_URL; // bare host like my-app.vercel.app
  if (v) {
    const url = v.startsWith('http') ? v : `https://${v}`;
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  // Check NEXTAUTH_URL but avoid localhost in production
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl && !nextAuthUrl.includes('localhost')) {
    const url = nextAuthUrl.replace(/\/$/, '');
    // Ensure we always use the canonical domain
    if (url.includes('stars-vacation-management.vercel.app')) {
      return url.replace('stars-vacation-management.vercel.app', 'starsvacationmanagementv2.vercel.app');
    }
    return url;
  }

  // For local dev or when no production URL is available, return empty string
  // Call sites should handle this appropriately
  return '';
}

export function absoluteUrl(path: string): string {
  const base = getBaseUrl();
  return base ? `${base}${path.startsWith('/') ? path : '/' + path}` : path;
}

export function adminVacationRequestUrl(id: string, locale = 'en'): string {
  const base = getBaseUrl();
  if (base) {
    return `${base}/${locale}/admin/vacation-requests/${id}`;
  }
  // Fallback to production URL for emails when no base URL is available
  return `https://starsvacationmanagementv2.vercel.app/${locale}/admin/vacation-requests/${id}`;
}

export function vacationRequestUrl(id: string, locale = 'en'): string {
  const base = getBaseUrl();
  if (base) {
    return `${base}/${locale}/vacation-request/${id}`;
  }
  // Fallback to production URL for emails when no base URL is available
  return `https://starsvacationmanagementv2.vercel.app/${locale}/vacation-request/${id}`;
}

export function adminDashboardUrl(locale = 'en'): string {
  const base = getBaseUrl();
  if (base) {
    return `${base}/${locale}/admin`;
  }
  // Fallback to production URL for emails when no base URL is available
  return `https://starsvacationmanagementv2.vercel.app/${locale}/admin`;
}

export function vacationRequestFormUrl(locale = 'en'): string {
  const base = getBaseUrl();
  if (base) {
    return `${base}/${locale}/vacation-request`;
  }
  // Fallback to production URL for emails when no base URL is available
  return `https://starsvacationmanagementv2.vercel.app/${locale}/vacation-request`;
}

