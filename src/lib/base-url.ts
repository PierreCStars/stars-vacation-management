import { headers } from 'next/headers';

export async function getBaseUrl() {
  // Prefer env in build/preview
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl;

  // At request time, derive from headers (works on Vercel)
  try {
    const h = await headers();
    const proto = h.get('x-forwarded-proto') ?? 'https';
    const host = h.get('host');
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() not available at build time
  }

  // Dev fallback
  return 'http://localhost:3000';
}
