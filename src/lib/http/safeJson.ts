/**
 * Safe JSON response utilities
 * Prevents duplicate keys when merging objects for API responses
 */

import { NextResponse } from 'next/server';

type AnyRecord = Record<string, unknown>;

/**
 * Safely merge two objects, removing conflicting keys from base before merging
 * This prevents duplicate key errors in TypeScript when spreading objects
 * 
 * @param base - Base object to merge into
 * @param overrides - Object with keys that should override base
 * @returns Merged object with no duplicate keys
 * 
 * @example
 * const base = { success: false, message: 'old', count: 3 };
 * const merged = safeJson(base, { success: true, message: 'new' });
 * // Result: { success: true, message: 'new', count: 3 }
 */
export function safeJson<T extends Record<string, any>, O extends Record<string, any>>(
  base: T,
  overrides: O,
): Omit<T, keyof O> & O {
  const cleaned = { ...base };
  
  // Remove any conflicting keys from base so we only define each once
  for (const k of Object.keys(overrides)) {
    delete (cleaned as Record<string, any>)[k];
  }
  
  return { ...cleaned, ...overrides } as Omit<T, keyof O> & O;
}

/**
 * Safely create a NextResponse.json with merged objects
 * Prevents duplicate keys when spreading result objects
 * 
 * @param base - Base object (typically from service result)
 * @param overrides - Override values (typically success, message, etc.)
 * @param init - Optional ResponseInit for status codes, headers, etc.
 * @returns NextResponse with merged JSON body
 * 
 * @example
 * const result = await service.run();
 * return safeNextJson(result, { success: true, message: 'Done' });
 */
export function safeNextJson<T extends Record<string, any>, O extends Record<string, any>>(
  base: T,
  overrides: O,
  init?: ResponseInit
): NextResponse<Omit<T, keyof O> & O> {
  return NextResponse.json(safeJson(base, overrides), init);
}

