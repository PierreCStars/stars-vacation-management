/**
 * Unit tests for monthly vacation summary
 * 
 * CRITICAL: These tests verify that multiple vacations per employee
 * are correctly included in the recap email and CSV.
 */

import { describe, it, expect, vi } from 'vitest';
import { getValidatedVacationsForMonth, calculateTotals, getMonthRangeInTimezone } from '@/lib/monthly-vacation-helper';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  isFirebaseAdminAvailable: () => true,
  firebaseAdmin: async () => ({
    db: {
      collection: (name: string) => ({
        where: (field: string, op: string, values: string[]) => ({
          get: async () => ({
            docs: [
              // Employee 1: 2 vacations in December
              {
                id: 'vac1',
                data: () => ({
                  userName: 'Pierre CORBUCCI',
                  company: 'Stars',
                  type: 'Full day',
                  status: 'validated',
                  startDate: '2025-12-12',
                  endDate: '2025-12-12',
                  isHalfDay: true,
                  durationDays: 0.5,
                  userId: 'user1',
                  userEmail: 'pierre@stars.mc'
                })
              },
              {
                id: 'vac2',
                data: () => ({
                  userName: 'Pierre CORBUCCI',
                  company: 'Stars',
                  type: 'Full day',
                  status: 'validated',
                  startDate: '2025-12-22',
                  endDate: '2025-12-24',
                  isHalfDay: false,
                  durationDays: 3,
                  userId: 'user1',
                  userEmail: 'pierre@stars.mc'
                })
              },
              // Employee 2: 1 vacation
              {
                id: 'vac3',
                data: () => ({
                  userName: 'John Doe',
                  company: 'Stars',
                  type: 'Full day',
                  status: 'validated',
                  startDate: '2025-12-15',
                  endDate: '2025-12-15',
                  isHalfDay: false,
                  durationDays: 1,
                  userId: 'user2',
                  userEmail: 'john@stars.mc'
                })
              }
            ]
          })
        })
      })
    },
    error: null
  })
}));

describe('Monthly Vacation Summary', () => {
  it('should include all vacations for an employee with multiple requests', async () => {
    const range = getMonthRangeInTimezone('Europe/Monaco');
    // Mock December 2025
    const startISO = '2025-12-01';
    const endISO = '2025-12-31';
    
    const approved = await getValidatedVacationsForMonth(startISO, endISO);
    
    // Verify we have 3 total requests
    expect(approved.length).toBe(3);
    
    // Verify Pierre has 2 requests
    const pierreRequests = approved.filter(r => r.employee === 'Pierre CORBUCCI');
    expect(pierreRequests.length).toBe(2);
    
    // Verify the first request (0.5 days)
    const halfDayRequest = pierreRequests.find(r => r.startDate === '2025-12-12');
    expect(halfDayRequest).toBeDefined();
    expect(halfDayRequest?.days).toBe(0.5);
    
    // Verify the second request (3 days)
    const multiDayRequest = pierreRequests.find(r => r.startDate === '2025-12-22');
    expect(multiDayRequest).toBeDefined();
    expect(multiDayRequest?.days).toBe(3);
    
    // Verify totals
    const { totalDays } = calculateTotals(approved);
    expect(totalDays).toBe(4.5); // 0.5 + 3 + 1
  });
  
  it('should generate CSV with all rows (one per vacation)', async () => {
    const range = getMonthRangeInTimezone('Europe/Monaco');
    const startISO = '2025-12-01';
    const endISO = '2025-12-31';
    
    const approved = await getValidatedVacationsForMonth(startISO, endISO);
    
    // Generate CSV (simulate the toCSV function)
    const headers = ['employee', 'company', 'type', 'status', 'startDate', 'endDate', 'days'];
    const esc = (val: any) => {
      const s = (val ?? "").toString();
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers.join(","), ...approved.map(r => headers.map(h => esc((r as any)[h])).join(","))].join("\n");
    
    // Count rows (excluding header)
    const csvRows = csv.split('\n');
    expect(csvRows.length).toBe(4); // 1 header + 3 data rows
    
    // Verify Pierre appears twice in CSV
    const pierreRows = csvRows.filter(row => row.includes('Pierre CORBUCCI'));
    expect(pierreRows.length).toBe(2);
  });
  
  it('should generate HTML table with all rows (one per vacation)', async () => {
    const range = getMonthRangeInTimezone('Europe/Monaco');
    const startISO = '2025-12-01';
    const endISO = '2025-12-31';
    
    const approved = await getValidatedVacationsForMonth(startISO, endISO);
    
    // Generate HTML table rows (simulate generateHTML)
    const tableRows = approved.map((r, index) => {
      const uniqueId = r.id || `row-${index}`;
      return `<tr data-vacation-id="${uniqueId}" data-employee="${r.employee}" data-index="${index}">`;
    }).join('');
    
    // Count <tr> tags
    const trCount = (tableRows.match(/<tr/g) || []).length;
    expect(trCount).toBe(3);
    
    // Verify Pierre appears twice in HTML
    const pierreRows = (tableRows.match(/data-employee="Pierre CORBUCCI"/g) || []);
    expect(pierreRows.length).toBe(2);
  });
});

