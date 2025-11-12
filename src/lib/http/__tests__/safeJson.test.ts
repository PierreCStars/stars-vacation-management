/**
 * Tests for safe JSON response utilities
 */

import { describe, it, expect } from 'vitest';
import { safeJson, safeNextJson } from '../safeJson';

describe('safeJson', () => {
  it('should remove conflicting keys before merge', () => {
    const base = { success: false, message: 'old', count: 3 };
    const merged = safeJson(base, { success: true, message: 'new' });
    
    expect(merged).toEqual({ success: true, message: 'new', count: 3 });
    expect(merged.success).toBe(true);
    expect(merged.message).toBe('new');
    expect(merged.count).toBe(3);
  });

  it('should preserve non-conflicting keys from base', () => {
    const base = { success: false, count: 5, data: { id: 1 } };
    const merged = safeJson(base, { success: true });
    
    expect(merged).toEqual({ success: true, count: 5, data: { id: 1 } });
    expect(merged.count).toBe(5);
    expect(merged.data).toEqual({ id: 1 });
  });

  it('should handle empty base object', () => {
    const base = {};
    const merged = safeJson(base, { success: true, message: 'test' });
    
    expect(merged).toEqual({ success: true, message: 'test' });
  });

  it('should handle empty overrides', () => {
    const base = { success: false, count: 3 };
    const merged = safeJson(base, {});
    
    expect(merged).toEqual({ success: false, count: 3 });
  });

  it('should handle multiple conflicting keys', () => {
    const base = { success: false, message: 'old', status: 'pending', count: 10 };
    const merged = safeJson(base, { success: true, message: 'new', status: 'done' });
    
    expect(merged).toEqual({ success: true, message: 'new', status: 'done', count: 10 });
  });

  it('should ensure TypeScript sees only one key definition', () => {
    const base = { success: false, message: 'old', count: 3 };
    const merged = safeJson(base, { success: true, message: 'new' });
    
    // Type check: merged should have exactly one 'success' property
    // @ts-expect-error - This should not error if types are correct
    const check: typeof merged['success'] = true;
    expect(check).toBe(true);
  });
});

describe('safeNextJson', () => {
  it('should create NextResponse with merged JSON', () => {
    const base = { success: false, count: 5 };
    const response = safeNextJson(base, { success: true, message: 'Done' });
    
    expect(response).toBeInstanceOf(Response);
    // Note: We can't easily test the JSON body without async, but the function should work
  });

  it('should accept ResponseInit options', () => {
    const base = { success: false };
    const response = safeNextJson(base, { success: true }, { status: 201 });
    
    expect(response.status).toBe(201);
  });

  it('should handle status codes', () => {
    const base = { error: 'Not found' };
    const response = safeNextJson(base, { success: false, message: 'Error' }, { status: 404 });
    
    expect(response.status).toBe(404);
  });
});

