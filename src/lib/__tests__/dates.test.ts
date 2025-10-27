import { describe, it, expect } from 'vitest';
import { parseLocalDate, parseISODate, formatISODate, getFirstDayOfCalendarGrid, doRangesOverlap } from '../dates';

describe('date utilities', () => {
  describe('parseLocalDate', () => {
    it('should parse ISO date string as local midnight', () => {
      const date = parseLocalDate('2025-12-25');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11); // December is month 11
      expect(date.getDate()).toBe(25);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should handle December 25, 2025 correctly', () => {
      const date = parseLocalDate('2025-12-25');
      // December 25, 2025 is a Thursday
      expect(date.getDay()).toBe(4); // 0=Sunday, 4=Thursday
    });

    it('should throw error for invalid date string', () => {
      expect(() => parseLocalDate('invalid')).toThrow();
    });
  });

  describe('parseISODate', () => {
    it('should parse date-only strings', () => {
      const date = parseISODate('2025-12-25');
      expect(date.getDate()).toBe(25);
      expect(date.getMonth()).toBe(11);
    });

    it('should parse full ISO strings with time', () => {
      const date = parseISODate('2025-12-25T14:30:00');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(25);
    });
  });

  describe('formatISODate', () => {
    it('should format date to YYYY-MM-DD', () => {
      const date = new Date(2025, 11, 25);
      expect(formatISODate(date)).toBe('2025-12-25');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2025, 0, 5);
      expect(formatISODate(date)).toBe('2025-01-05');
    });
  });

  describe('getFirstDayOfCalendarGrid', () => {
    it('should return Monday start for January 2025', () => {
      const firstDay = getFirstDayOfCalendarGrid(2025, 0, 1); // January 2025
      // January 1, 2025 is a Wednesday
      // The Monday before should be December 30, 2024
      expect(firstDay.getDate()).toBe(30);
      expect(firstDay.getMonth()).toBe(11); // December
      expect(firstDay.getFullYear()).toBe(2024);
    });

    it('should return correct first day for month starting on Monday', () => {
      // Find a month that starts on Monday and test
      const firstDay = getFirstDayOfCalendarGrid(2024, 3, 1); // April 2024
      // April 1, 2024 is a Monday
      expect(firstDay.getDate()).toBe(1);
      expect(firstDay.getMonth()).toBe(3); // April
    });
  });

  describe('doRangesOverlap', () => {
    it('should detect overlapping ranges', () => {
      const start1 = new Date('2025-12-01');
      const end1 = new Date('2025-12-10');
      const start2 = new Date('2025-12-08');
      const end2 = new Date('2025-12-15');
      
      expect(doRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });

    it('should detect non-overlapping ranges', () => {
      const start1 = new Date('2025-12-01');
      const end1 = new Date('2025-12-05');
      const start2 = new Date('2025-12-10');
      const end2 = new Date('2025-12-15');
      
      expect(doRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should detect adjacent ranges as non-overlapping', () => {
      const start1 = new Date('2025-12-01');
      const end1 = new Date('2025-12-05');
      const start2 = new Date('2025-12-06');
      const end2 = new Date('2025-12-10');
      
      expect(doRangesOverlap(start1, end1, start2, end2)).toBe(false);
    });

    it('should detect ranges that touch on edges', () => {
      const start1 = new Date('2025-12-01');
      const end1 = new Date('2025-12-05');
      const start2 = new Date('2025-12-05');
      const end2 = new Date('2025-12-10');
      
      // Ranges that touch at the boundary still overlap
      expect(doRangesOverlap(start1, end1, start2, end2)).toBe(true);
    });
  });
});

