/**
 * Tests for date normalization utilities
 * Ensures all-day events from Google Calendar are correctly converted from exclusive to inclusive end dates
 */

import { describe, it, expect } from 'vitest';
import {
  convertExclusiveToInclusive,
  normalizeAllDayEvent,
  isDayInAllDayEventRange,
  isAllDayEvent
} from '../date-normalization';

describe('convertExclusiveToInclusive', () => {
  it('should convert exclusive end date to inclusive (one day before)', () => {
    expect(convertExclusiveToInclusive('2025-12-26')).toBe('2025-12-25');
    expect(convertExclusiveToInclusive('2025-01-02')).toBe('2025-01-01');
    expect(convertExclusiveToInclusive('2025-03-01')).toBe('2025-02-28');
  });

  it('should handle year boundaries', () => {
    expect(convertExclusiveToInclusive('2026-01-01')).toBe('2025-12-31');
  });

  it('should handle leap years', () => {
    expect(convertExclusiveToInclusive('2024-03-01')).toBe('2024-02-29');
    expect(convertExclusiveToInclusive('2025-03-01')).toBe('2025-02-28');
  });

  it('should return invalid input as-is', () => {
    expect(convertExclusiveToInclusive('invalid')).toBe('invalid');
    expect(convertExclusiveToInclusive('')).toBe('');
  });
});

describe('normalizeAllDayEvent', () => {
  it('should normalize single-day event (exclusive end = start + 1 day)', () => {
    const result = normalizeAllDayEvent('2025-12-25', '2025-12-26');
    expect(result).toEqual({
      startDate: '2025-12-25',
      endDate: '2025-12-25'
    });
  });

  it('should normalize multi-day event', () => {
    const result = normalizeAllDayEvent('2025-12-24', '2025-12-27');
    expect(result).toEqual({
      startDate: '2025-12-24',
      endDate: '2025-12-26'
    });
  });

  it('should handle event where end equals start (already inclusive)', () => {
    const result = normalizeAllDayEvent('2025-12-25', '2025-12-25');
    expect(result).toEqual({
      startDate: '2025-12-25',
      endDate: '2025-12-25'
    });
  });

  it('should handle missing end date (treat as single-day)', () => {
    const result = normalizeAllDayEvent('2025-12-25', '');
    expect(result).toEqual({
      startDate: '2025-12-25',
      endDate: '2025-12-25'
    });
  });
});

describe('isDayInAllDayEventRange', () => {
  it('should return true for single-day event on that day', () => {
    const day = new Date('2025-12-25T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-25', '2025-12-25')).toBe(true);
  });

  it('should return false for single-day event on different day', () => {
    const day = new Date('2025-12-26T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-25', '2025-12-25')).toBe(false);
  });

  it('should return true for multi-day event on start day', () => {
    const day = new Date('2025-12-24T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-24', '2025-12-26')).toBe(true);
  });

  it('should return true for multi-day event on end day', () => {
    const day = new Date('2025-12-26T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-24', '2025-12-26')).toBe(true);
  });

  it('should return true for multi-day event on middle day', () => {
    const day = new Date('2025-12-25T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-24', '2025-12-26')).toBe(true);
  });

  it('should return false for multi-day event before start', () => {
    const day = new Date('2025-12-23T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-24', '2025-12-26')).toBe(false);
  });

  it('should return false for multi-day event after end', () => {
    const day = new Date('2025-12-27T00:00:00');
    expect(isDayInAllDayEventRange(day, '2025-12-24', '2025-12-26')).toBe(false);
  });
});

describe('isAllDayEvent', () => {
  it('should return true for all-day event (has date, no dateTime)', () => {
    expect(isAllDayEvent({ date: '2025-12-25' })).toBe(true);
    expect(isAllDayEvent({ date: '2025-12-25', dateTime: undefined })).toBe(true);
  });

  it('should return false for timed event (has dateTime)', () => {
    expect(isAllDayEvent({ dateTime: '2025-12-25T10:00:00Z' })).toBe(false);
    expect(isAllDayEvent({ date: '2025-12-25', dateTime: '2025-12-25T10:00:00Z' })).toBe(false);
  });

  it('should return false for empty object', () => {
    expect(isAllDayEvent({})).toBe(false);
  });
});

describe('Real-world scenarios', () => {
  it('should handle Christmas 2025 (single-day holiday)', () => {
    // Google Calendar: start.date='2025-12-25', end.date='2025-12-26' (exclusive)
    const normalized = normalizeAllDayEvent('2025-12-25', '2025-12-26');
    expect(normalized).toEqual({
      startDate: '2025-12-25',
      endDate: '2025-12-25'
    });

    // Should appear only on Dec 25
    const dec25 = new Date('2025-12-25T00:00:00');
    const dec26 = new Date('2025-12-26T00:00:00');
    expect(isDayInAllDayEventRange(dec25, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(dec26, normalized.startDate, normalized.endDate)).toBe(false);
  });

  it('should handle multi-day holiday (Dec 24-26)', () => {
    // Google Calendar: start.date='2025-12-24', end.date='2025-12-27' (exclusive)
    const normalized = normalizeAllDayEvent('2025-12-24', '2025-12-27');
    expect(normalized).toEqual({
      startDate: '2025-12-24',
      endDate: '2025-12-26'
    });

    // Should appear on Dec 24, 25, 26 only
    const dec23 = new Date('2025-12-23T00:00:00');
    const dec24 = new Date('2025-12-24T00:00:00');
    const dec25 = new Date('2025-12-25T00:00:00');
    const dec26 = new Date('2025-12-26T00:00:00');
    const dec27 = new Date('2025-12-27T00:00:00');

    expect(isDayInAllDayEventRange(dec23, normalized.startDate, normalized.endDate)).toBe(false);
    expect(isDayInAllDayEventRange(dec24, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(dec25, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(dec26, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(dec27, normalized.startDate, normalized.endDate)).toBe(false);
  });

  it('should handle DST boundary (March 2025)', () => {
    // DST change in Europe: March 30, 2025
    // Event from March 29 to March 31 (exclusive end = April 1)
    const normalized = normalizeAllDayEvent('2025-03-29', '2025-04-01');
    expect(normalized).toEqual({
      startDate: '2025-03-29',
      endDate: '2025-03-31'
    });

    // Should appear on March 29, 30, 31 only
    const mar28 = new Date('2025-03-28T00:00:00');
    const mar29 = new Date('2025-03-29T00:00:00');
    const mar30 = new Date('2025-03-30T00:00:00');
    const mar31 = new Date('2025-03-31T00:00:00');
    const apr1 = new Date('2025-04-01T00:00:00');

    expect(isDayInAllDayEventRange(mar28, normalized.startDate, normalized.endDate)).toBe(false);
    expect(isDayInAllDayEventRange(mar29, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(mar30, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(mar31, normalized.startDate, normalized.endDate)).toBe(true);
    expect(isDayInAllDayEventRange(apr1, normalized.startDate, normalized.endDate)).toBe(false);
  });
});

