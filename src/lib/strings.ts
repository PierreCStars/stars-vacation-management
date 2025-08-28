/**
 * Safe string utilities to prevent .trim() on undefined errors
 */

export function toStr(val: unknown, fallback = ''): string {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'string') return val;
  try { 
    return String(val); 
  } catch { 
    return fallback; 
  }
}

export function safeTrim(val: unknown, fallback = ''): string {
  const s = toStr(val, fallback);
  return s.trim();
}

export function nonEmpty(val: unknown, fallback = ''): string {
  const s = safeTrim(val, '');
  return s.length ? s : fallback;
}

/**
 * Safe string operations for common use cases
 */
export function safeSplit(val: unknown, separator: string | RegExp, fallback: string[] = []): string[] {
  const s = toStr(val, '');
  if (!s) return fallback;
  try {
    return s.split(separator);
  } catch {
    return fallback;
  }
}

export function safeStartsWith(val: unknown, searchString: string, fallback = false): boolean {
  const s = toStr(val, '');
  if (!s) return fallback;
  try {
    return s.startsWith(searchString);
  } catch {
    return fallback;
  }
}

export function safeSubstring(val: unknown, start: number, end?: number, fallback = ''): string {
  const s = toStr(val, '');
  if (!s) return fallback;
  try {
    return s.substring(start, end);
  } catch {
    return fallback;
  }
}
