import { describe, it, expect } from 'vitest';
import { countWorkingDays } from '../duration-calculator';

describe('countWorkingDays', () => {
  it('compte 1 pour un jour ouvré unique', () => {
    expect(countWorkingDays('2026-06-15', '2026-06-15')).toBe(1); // lundi
  });

  it('exclut samedi et dimanche', () => {
    // lun 15 → dim 21 juin 2026 = 5 jours ouvrés (lun-ven), sam/dim exclus
    expect(countWorkingDays('2026-06-15', '2026-06-21')).toBe(5);
  });

  it('renvoie 0 pour un week-end seul', () => {
    expect(countWorkingDays('2026-06-20', '2026-06-21')).toBe(0); // sam+dim
  });

  it('exclut les jours fériés monégasques', () => {
    // 01/05/2026 (Fête du Travail, vendredi) doit être exclu.
    // jeu 30/04 → ven 01/05 : jeudi compte, vendredi férié exclu → 1
    expect(countWorkingDays('2026-04-30', '2026-05-01')).toBe(1);
  });

  it('Noël 2026 (vendredi 25/12) exclu', () => {
    // jeu 24 → ven 25 déc 2026 : jeudi ouvré, vendredi férié → 1
    expect(countWorkingDays('2026-12-24', '2026-12-25')).toBe(1);
  });

  it('semaine entière avec un férié au milieu', () => {
    // Ascension 2026 = jeudi 14/05. Lun 11 → ven 15 mai : 5 jours - 1 férié = 4
    expect(countWorkingDays('2026-05-11', '2026-05-15')).toBe(4);
  });

  it('dates inversées → 0', () => {
    expect(countWorkingDays('2026-06-20', '2026-06-15')).toBe(0);
  });
});
