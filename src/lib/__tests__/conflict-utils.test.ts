import { describe, it, expect } from 'vitest';
import { countUniqueConflicts } from '../conflict-utils';

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
