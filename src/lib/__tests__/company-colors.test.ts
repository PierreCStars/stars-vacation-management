import { describe, it, expect } from 'vitest';
import { normalizeCompanyCode, getCompanyHexColor } from '../company-colors';

describe('normalizeCompanyCode', () => {
  it('reconnaît les codes du formulaire', () => {
    expect(normalizeCompanyCode('STARS_MC')).toBe('STARS_MC');
    expect(normalizeCompanyCode('STARS_REAL_ESTATE')).toBe('STARS_REAL_ESTATE');
    expect(normalizeCompanyCode('LE_PNEU')).toBe('LE_PNEU');
  });

  it('reconnaît les noms affichés (casse/espaces/points variables)', () => {
    expect(normalizeCompanyCode('stars.mc')).toBe('STARS_MC');
    expect(normalizeCompanyCode('Stars MC')).toBe('STARS_MC');
    expect(normalizeCompanyCode('Stars Real Estate')).toBe('STARS_REAL_ESTATE');
    expect(normalizeCompanyCode(' le  pneu ')).toBe('LE_PNEU');
  });

  it('renvoie null pour une entreprise inconnue ou vide', () => {
    expect(normalizeCompanyCode('Unknown')).toBeNull();
    expect(normalizeCompanyCode('')).toBeNull();
    expect(normalizeCompanyCode(null)).toBeNull();
  });

  it('le code normalisé donne la bonne couleur', () => {
    expect(getCompanyHexColor(normalizeCompanyCode('Stars Real Estate')!)).toBe('#ef4444');
    expect(getCompanyHexColor(normalizeCompanyCode('stars.mc')!)).toBe('#3b82f6');
  });
});
