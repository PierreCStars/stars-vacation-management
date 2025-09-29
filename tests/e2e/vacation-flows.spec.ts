import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Simulate login in E2E mode
  await page.goto('/api/test-auth'); // returns tester@stars.mc
  const resp = await page.waitForResponse(/api\/test-auth/);
  const body = await resp.json();
  expect(body.ok).toBeTruthy();
  await page.addInitScript(email => { localStorage.setItem('e2eEmail', email); }, body.email);
});

test('1) Emails sent to admins and requester on submission', async ({ page }) => {
  // Start with clean inbox
  await page.goto('/api/test/email/clear'); // create this test endpoint to clear FakeInbox
  await page.goto('/en/vacation-request');

  // Fill and submit a new vacation
  await page.getByTestId('start-date').fill('2025-10-01');
  await page.getByTestId('end-date').fill('2025-10-05');
  await page.getByTestId('submit-button').click();

  // Assert UI feedback
  await expect(page.getByText(/Request submitted/i)).toBeVisible();

  // Check fake inbox contents
  const inbox = await (await page.request.get('/api/test/email/inbox')).json();
  const adminNotify = inbox.find((m: any) => m.type === 'ADMIN_NOTIFY');
  const requester = inbox.find((m: any) => m.type === 'REQUEST_SUBMITTED');

  expect(adminNotify).toBeTruthy();
  expect(adminNotify.to).toEqual(expect.arrayContaining(['Daniel@stars.mc','Johnny@stars.mc','Compta@stars.mc']));
  expect(requester).toBeTruthy();
  expect(requester.to).toBe('tester@stars.mc');
});

test('2) Calendars display on admin dashboard and request page', async ({ page }) => {
  await page.goto('/en/admin/vacation-requests');
  await expect(page.getByTestId('admin-calendar')).toBeVisible();

  // Open the just-created request detail
  await page.getByRole('link', { name: /Request #/i }).first().click();
  await expect(page.getByTestId('request-calendar')).toBeVisible();
});

test('3) Approve writes to embedded & Google calendar and emails requester', async ({ page }) => {
  await page.goto('/api/test/email/clear');
  await page.goto('/api/test/calendar/clear');

  await page.goto('/en/admin/vacation-requests');
  // Open oldest pending request
  await page.getByRole('link', { name: /Request #/i }).first().click();
  const requestId = await page.getByTestId('request-id').innerText();

  await page.getByTestId('approve-button').click();
  await expect(page.getByText(/Approved/i)).toBeVisible();

  // Email to requester (decision)
  const inbox = await (await page.request.get('/api/test/email/inbox')).json();
  const decision = inbox.find((m: any) => m.type === 'REQUEST_DECISION' && m.requestId === requestId);
  expect(decision).toBeTruthy();
  expect(decision.decision).toBe('APPROVED');

  // Embedded calendar check (app store)
  const embedded = await (await page.request.get(`/api/test/embedded-calendar/by-request/${requestId}`)).json();
  expect(embedded?.exists).toBe(true);

  // Google Calendar fake check
  const gcal = await (await page.request.get(`/api/test/gcal/by-request/${requestId}`)).json();
  expect(gcal?.exists).toBe(true);
});

test('4) Deny removes/does-not-create calendar and emails requester', async ({ page }) => {
  await page.goto('/api/test/email/clear');
  await page.goto('/api/test/calendar/clear');

  await page.goto('/en/admin/vacation-requests');
  await page.getByRole('link', { name: /Request #/i }).nth(1).click();
  const requestId = await page.getByTestId('request-id').innerText();

  await page.getByTestId('deny-button').click();
  await expect(page.getByText(/Denied/i)).toBeVisible();

  const inbox = await (await page.request.get('/api/test/email/inbox')).json();
  const decision = inbox.find((m: any) => m.type === 'REQUEST_DECISION' && m.requestId === requestId);
  expect(decision).toBeTruthy();
  expect(decision.decision).toBe('DENIED');

  // Embedded calendar entry should not exist (or be removed)
  const embedded = await (await page.request.get(`/api/test/embedded-calendar/by-request/${requestId}`)).json();
  expect(embedded?.exists).toBe(false);

  // Google calendar event should not exist
  const gcal = await (await page.request.get(`/api/test/gcal/by-request/${requestId}`)).json();
  expect(gcal?.exists).toBe(false);
});
