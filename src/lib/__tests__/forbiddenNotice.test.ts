import { describe, it, expect } from 'vitest';
import {
  getActiveWindows,
  validateWindows,
  type NoticeWindow,
} from '../forbiddenNotice';

const win = (over: Partial<NoticeWindow> = {}): NoticeWindow => ({
  id: '1', enabled: true, label: 'Top Marques',
  startDate: '2027-05-06', endDate: '2027-05-10',
  message: { fr: 'fr', en: 'en', it: 'it' }, ...over,
});

describe('getActiveWindows', () => {
  it('inclut une fenêtre activée si le jour est dans la plage (bornes incluses)', () => {
    expect(getActiveWindows([win()], '2027-05-06')).toHaveLength(1);
    expect(getActiveWindows([win()], '2027-05-10')).toHaveLength(1);
  });
  it('exclut hors plage', () => {
    expect(getActiveWindows([win()], '2027-05-05')).toHaveLength(0);
    expect(getActiveWindows([win()], '2027-05-11')).toHaveLength(0);
  });
  it('exclut une fenêtre désactivée', () => {
    expect(getActiveWindows([win({ enabled: false })], '2027-05-06')).toHaveLength(0);
  });
  it('gère plusieurs fenêtres actives', () => {
    const a = win({ id: 'a' });
    const b = win({ id: 'b', startDate: '2027-05-01', endDate: '2027-12-31' });
    expect(getActiveWindows([a, b], '2027-05-06')).toHaveLength(2);
  });
});

describe('validateWindows', () => {
  it('accepte des fenêtres valides', () => {
    expect(validateWindows([win()]).ok).toBe(true);
  });
  it('rejette startDate > endDate', () => {
    expect(validateWindows([win({ startDate: '2027-05-11' })]).ok).toBe(false);
  });
  it('rejette une date mal formée', () => {
    expect(validateWindows([win({ startDate: '06/05/2027' })]).ok).toBe(false);
  });
  it('rejette un libellé vide', () => {
    expect(validateWindows([win({ label: '' })]).ok).toBe(false);
  });
  it('rejette un message EN vide', () => {
    expect(validateWindows([win({ message: { fr: 'x', en: '', it: 'y' } })]).ok).toBe(false);
  });
  it('rejette plus de 20 fenêtres', () => {
    expect(validateWindows(Array.from({ length: 21 }, (_, i) => win({ id: String(i) }))).ok).toBe(false);
  });
});
