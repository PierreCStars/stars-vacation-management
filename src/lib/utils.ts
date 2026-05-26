import type { SupportedLocale } from '@/locales';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Build a locale-aware href like /en/path or /fr/path */
export function createLocaleLink(path: string, locale: SupportedLocale) {
  // Normalize leading slashes
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `/${locale}/${clean}`;
}

// small helpers used across the app (safe no-ops if not needed)
export const isDefined = <T>(v: T | undefined | null): v is T => v !== undefined && v !== null;

/**
 * Merge Tailwind classes, de-duplicating conflicts.
 * Used by shadcn-style components and our own primitives.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
