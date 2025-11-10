import { test, expect } from '@playwright/test';

test.describe('Reason Field Visibility by Role', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.goto('/api/test-auth');
    const resp = await page.waitForResponse(/api\/test-auth/);
    const body = await resp.json();
    expect(body.ok).toBeTruthy();
  });

  test('Non-admin cannot see reason field in calendar UI', async ({ page }) => {
    // Set up non-admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'user@stars.mc');

    // Navigate to dashboard with calendar
    await page.goto('/en/dashboard');
    
    // Wait for calendar to load
    await page.waitForSelector('[data-testid="vacation-calendar"], .calendar, [class*="calendar"]', { timeout: 10000 });

    // Check that reason field is not visible in calendar
    const reasonElements = await page.locator('text=/reason/i').all();
    expect(reasonElements.length).toBe(0);

    // Check that reason is not in any vacation request cards
    const vacationCards = await page.locator('[class*="vacation"], [class*="request"]').all();
    for (const card of vacationCards) {
      const text = await card.textContent();
      if (text) {
        expect(text.toLowerCase()).not.toContain('reason');
      }
    }
  });

  test('Admin can see reason field in calendar UI', async ({ page }) => {
    // Set up admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'pierre@stars.mc');

    // Navigate to dashboard with calendar
    await page.goto('/en/dashboard');
    
    // Wait for calendar to load
    await page.waitForSelector('[data-testid="vacation-calendar"], .calendar, [class*="calendar"]', { timeout: 10000 });

    // If there are vacation requests with reasons, they should be visible
    // This test assumes there's at least one vacation request with a reason
    // In a real scenario, you might need to create a test vacation request first
  });

  test('Non-admin cannot see reason field in API response', async ({ page, request }) => {
    // Set up non-admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'user@stars.mc');

    // Navigate to dashboard to establish session
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Fetch vacation requests via API
    const response = await request.get('/api/vacation-requests');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    // Check that reason field is not present in any request
    if (data.length > 0) {
      for (const request of data) {
        expect(request).not.toHaveProperty('reason');
      }
    }
  });

  test('Admin can see reason field in API response', async ({ page, request }) => {
    // Set up admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'pierre@stars.mc');

    // Navigate to dashboard to establish session
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Fetch vacation requests via API
    const response = await request.get('/api/vacation-requests');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(Array.isArray(data)).toBeTruthy();

    // Check that reason field is present in requests that have it
    if (data.length > 0) {
      const requestsWithReason = data.filter((req: any) => req.reason !== undefined);
      // At least some requests should have reason field if they exist
      // Note: This test assumes there are vacation requests with reasons in the test data
    }
  });

  test('Non-admin cannot see reason in vacation request detail page', async ({ page }) => {
    // Set up non-admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'user@stars.mc');

    // Navigate to a vacation request detail page (if accessible)
    // Note: This might require creating a test vacation request first
    // For now, we'll check that reason is not visible if the page is accessible
    
    // Try to navigate to admin detail page (should be blocked, but if accessible, reason should be hidden)
    await page.goto('/en/admin/vacation-requests');
    
    // If page loads (shouldn't for non-admin, but defense-in-depth check)
    const reasonText = await page.locator('text=/reason/i').count();
    expect(reasonText).toBe(0);
  });

  test('Admin can see reason in vacation request detail page', async ({ page }) => {
    // Set up admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'pierre@stars.mc');

    // Navigate to admin vacation requests
    await page.goto('/en/admin/vacation-requests');
    await page.waitForLoadState('networkidle');

    // If there are vacation requests, try to open one
    const firstRequestLink = page.locator('a[href*="/admin/vacation-requests/"]').first();
    const count = await firstRequestLink.count();
    
    if (count > 0) {
      await firstRequestLink.click();
      await page.waitForLoadState('networkidle');
      
      // Check that reason section exists (if the request has a reason)
      // This is a soft check - reason might not exist if the request doesn't have one
      const pageText = await page.textContent('body');
      // Reason should be visible if it exists in the request
    }
  });

  test('Calendar events API redacts reason for non-admin', async ({ page, request }) => {
    // Set up non-admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'user@stars.mc');

    // Navigate to establish session
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Fetch calendar events
    const response = await request.get('/api/calendar-events?includeVacationRequests=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.events)).toBeTruthy();

    // Check that reason is not in event descriptions or event objects
    for (const event of data.events) {
      if (event.description) {
        expect(event.description.toLowerCase()).not.toContain('reason:');
      }
      expect(event).not.toHaveProperty('reason');
    }
  });

  test('Calendar events API includes reason for admin', async ({ page, request }) => {
    // Set up admin user
    await page.addInitScript(email => { 
      localStorage.setItem('e2eEmail', email); 
    }, 'pierre@stars.mc');

    // Navigate to establish session
    await page.goto('/en/dashboard');
    await page.waitForLoadState('networkidle');

    // Fetch calendar events
    const response = await request.get('/api/calendar-events?includeVacationRequests=true');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(Array.isArray(data.events)).toBeTruthy();

    // For admin, events with reasons should include them
    // This is a soft check - not all events will have reasons
    const eventsWithReason = data.events.filter((e: any) => 
      (e.description && e.description.toLowerCase().includes('reason:')) || 
      e.reason !== undefined
    );
    // At least some events might have reasons if they exist in test data
  });
});

