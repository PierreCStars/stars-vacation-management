import { describe, it, expect } from 'vitest';
import { ADMINS, isAdmin, isReadOnlyAdmin, isFullAdmin } from '../../config/admins';

describe('Admin configuration', () => {
  it('has correct admin list', () => {
    expect(ADMINS).toHaveLength(4);
    expect(ADMINS.map(a => a.email)).toEqual([
      'Pierre@stars.mc',
      'johnny@stars.mc',
      'daniel@stars.mc',
      'compta@stars.mc'
    ]);
  });
  
  it('correctly identifies admins', () => {
    expect(isAdmin('Pierre@stars.mc')).toBe(true);
    expect(isAdmin('pierre@stars.mc')).toBe(true); // case insensitive
    expect(isAdmin('PIERRE@STARS.MC')).toBe(true); // case insensitive
    expect(isAdmin('johnny@stars.mc')).toBe(true);
    expect(isAdmin('daniel@stars.mc')).toBe(true);
    expect(isAdmin('compta@stars.mc')).toBe(true);
  });
  
  it('correctly identifies full admins', () => {
    expect(isFullAdmin('Pierre@stars.mc')).toBe(true);
    expect(isFullAdmin('johnny@stars.mc')).toBe(true);
    expect(isFullAdmin('daniel@stars.mc')).toBe(true);
    expect(isFullAdmin('compta@stars.mc')).toBe(false);
  });
  
  it('correctly identifies read-only admins', () => {
    expect(isReadOnlyAdmin('compta@stars.mc')).toBe(true);
    expect(isReadOnlyAdmin('Pierre@stars.mc')).toBe(false);
    expect(isReadOnlyAdmin('johnny@stars.mc')).toBe(false);
    expect(isReadOnlyAdmin('daniel@stars.mc')).toBe(false);
  });
  
  it('rejects non-admins', () => {
    expect(isAdmin('user@stars.mc')).toBe(false);
    expect(isAdmin('admin@other.com')).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
    expect(isAdmin('')).toBe(false);
  });
});
