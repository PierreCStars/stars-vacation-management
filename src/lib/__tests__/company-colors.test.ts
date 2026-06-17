import { describe, it, expect } from 'vitest';
import { normalizeCompanyCode, getCompanyHexColor, readableTextColor } from '../company-colors';

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

  it('le code normalisé donne la couleur officielle de la charte', () => {
    expect(getCompanyHexColor(normalizeCompanyCode('Stars Real Estate')!)).toBe('#273341');
    expect(getCompanyHexColor(normalizeCompanyCode('stars.mc')!)).toBe('#D8B11B');
    expect(getCompanyHexColor(normalizeCompanyCode('Stars Yachting')!)).toBe('#21254B');
    expect(getCompanyHexColor(normalizeCompanyCode('Le Pneu')!)).toBe('#EDF01A');
  });
});

describe('readableTextColor', () => {
  it('texte foncé sur fonds clairs (jaune Le Pneu, doré Stars.mc)', () => {
    expect(readableTextColor('#EDF01A')).toBe('#0A0A0A');
    expect(readableTextColor('#D8B11B')).toBe('#0A0A0A');
  });
  it('texte blanc sur fonds sombres (bleu nuit, ardoise, bleu ciel)', () => {
    expect(readableTextColor('#21254B')).toBe('#FFFFFF');
    expect(readableTextColor('#273341')).toBe('#FFFFFF');
    expect(readableTextColor('#0B77BD')).toBe('#FFFFFF');
  });
});
