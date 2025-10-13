import { describe, it, expect } from 'vitest';
import { ADMINS, isAdmin } from '../../config/admins';

describe('Admin configuration', () => {
  it('has correct admin list', () => {
    expect(ADMINS).toHaveLength(1);
    expect(ADMINS.map(a => a.email)).toEqual([
      'Pierre@stars.mc'
    ]);
    expect(ADMINS.every(a => a.access === 'ALL')).toBe(true);
  });
  
  it('correctly identifies admins', () => {
    expect(isAdmin('Pierre@stars.mc')).toBe(true);
    expect(isAdmin('pierre@stars.mc')).toBe(true); // case insensitive
    expect(isAdmin('PIERRE@STARS.MC')).toBe(true); // case insensitive
  });
  
  it('rejects non-admins', () => {
    expect(isAdmin('user@stars.mc')).toBe(false);
    expect(isAdmin('admin@other.com')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });
});
