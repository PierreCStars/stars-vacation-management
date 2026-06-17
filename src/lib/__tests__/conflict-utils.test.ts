import { describe, it, expect } from 'vitest';
import { countUniqueConflicts, countCompanyConflicts } from '../conflict-utils';

describe('countCompanyConflicts (même jour)', () => {
  it('0 quand les congés sont de sociétés différentes', () => {
    // Cas réel : Sacha (stars.mc) + Sarah (Stars Real Estate) le même jour
    expect(countCompanyConflicts([
      { company: 'stars.mc' },
      { company: 'Stars Real Estate' },
    ])).toBe(0);
  });

  it('1 quand deux personnes de la MÊME société se chevauchent', () => {
    expect(countCompanyConflicts([
      { company: 'stars.mc' },
      { company: 'stars.mc' },
    ])).toBe(1);
  });

  it('compte une fois par société, même à 3 personnes', () => {
    expect(countCompanyConflicts([
      { company: 'stars.mc' },
      { company: 'stars.mc' },
      { company: 'stars.mc' },
    ])).toBe(1);
  });

  it('deux sociétés en conflit simultané = 2', () => {
    expect(countCompanyConflicts([
      { company: 'stars.mc' }, { company: 'stars.mc' },
      { company: 'Le Pneu' }, { company: 'Le Pneu' },
    ])).toBe(2);
  });

  it('normalise casse/espaces et gère company manquante', () => {
    expect(countCompanyConflicts([
      { company: ' stars.mc ' }, { company: 'STARS.MC' },
    ])).toBe(1);
    expect(countCompanyConflicts([{}, {}])).toBe(1); // 2x UNKNOWN
    expect(countCompanyConflicts([{ company: 'stars.mc' }])).toBe(0);
  });
});

const req = (id: string, otherIds: string[] = []) => ({
  id,
  conflicts: otherIds.length
    ? [{ conflictingRequests: otherIds.map(oid => ({ id: oid })) }]
    : [],
});

describe('countUniqueConflicts', () => {
  it('0 quand aucun conflit', () => {
    expect(countUniqueConflicts([req('a'), req('b')])).toBe(0);
  });

  it('une paire A↔B (chacun référence l\'autre) = 1 conflit, pas 2', () => {
    expect(countUniqueConflicts([req('a', ['b']), req('b', ['a'])])).toBe(1);
  });

  it('A en conflit avec B et C (non liés entre eux) = 2', () => {
    expect(
      countUniqueConflicts([req('a', ['b', 'c']), req('b', ['a']), req('c', ['a'])]),
    ).toBe(2);
  });

  it('trois personnes se chevauchant deux à deux = 3 paires', () => {
    expect(
      countUniqueConflicts([
        req('a', ['b', 'c']),
        req('b', ['a', 'c']),
        req('c', ['a', 'b']),
      ]),
    ).toBe(3);
  });

  it('robuste aux données manquantes', () => {
    expect(countUniqueConflicts([])).toBe(0);
    expect(countUniqueConflicts([{ id: 'a' } as any])).toBe(0);
  });
});
