import { describe, it, expect } from 'vitest';
import { isAdmin, isFullAdmin, canValidateCompany, validatableCompanies } from '../admins';

describe('admins — périmètre de validation', () => {
  it('lorenzo est admin complet', () => {
    expect(isAdmin('lorenzo@stars.mc')).toBe(true);
    expect(isFullAdmin('lorenzo@stars.mc')).toBe(true);
  });

  it('johnny valide toutes les entreprises', () => {
    expect(canValidateCompany('johnny@stars.mc', 'STARS_MC')).toBe(true);
    expect(canValidateCompany('johnny@stars.mc', 'STARS_YACHTING')).toBe(true);
    expect(canValidateCompany('johnny@stars.mc', 'Stars Real Estate')).toBe(true);
    expect(validatableCompanies('johnny@stars.mc')).toBeNull(); // global
  });

  it('daniel valide uniquement Stars.mc / Le Pneu / Midi Pneu', () => {
    expect(canValidateCompany('daniel@stars.mc', 'STARS_MC')).toBe(true);
    expect(canValidateCompany('daniel@stars.mc', 'stars.mc')).toBe(true); // nom affiché
    expect(canValidateCompany('daniel@stars.mc', 'LE_PNEU')).toBe(true);
    expect(canValidateCompany('daniel@stars.mc', 'MIDI_PNEU')).toBe(true);
    expect(canValidateCompany('daniel@stars.mc', 'STARS_YACHTING')).toBe(false);
    expect(canValidateCompany('daniel@stars.mc', 'Stars Real Estate')).toBe(false);
    expect(canValidateCompany('daniel@stars.mc', 'STARS_AVIATION')).toBe(false);
    expect(validatableCompanies('daniel@stars.mc')).toEqual(['STARS_MC', 'LE_PNEU', 'MIDI_PNEU']);
  });

  it('compta (READ_ONLY) ne valide rien', () => {
    expect(canValidateCompany('compta@stars.mc', 'STARS_MC')).toBe(false);
    expect(validatableCompanies('compta@stars.mc')).toEqual([]);
  });

  it('un non-admin ne valide rien', () => {
    expect(canValidateCompany('someone@stars.mc', 'STARS_MC')).toBe(false);
  });
});
