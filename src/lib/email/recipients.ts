/**
 * Central recipient resolver for ALL outbound email.
 *
 * Test mode (default ON): every email is redirected to a single test inbox
 * (EMAIL_TEST_RECIPIENT, default pierre@stars.mc) so the team can validate
 * branding and content without spamming real admins / employees.
 *
 * To send to the real intended recipients, set EMAIL_TEST_MODE=false in the
 * Vercel environment. Until then the default is SAFE (redirect to the test
 * inbox) even if the env var is missing.
 */

export function isEmailTestMode(): boolean {
  // Safe default: anything other than an explicit "false" keeps test mode ON.
  return process.env.EMAIL_TEST_MODE !== 'false';
}

export function testRecipient(): string {
  return process.env.EMAIL_TEST_RECIPIENT?.trim() || 'pierre@stars.mc';
}

/**
 * Resolve the final recipient list. In test mode, collapses any intended
 * recipients to the single test inbox. Logs the redirect for traceability.
 */
export function resolveRecipients(intended: string[]): string[] {
  const cleaned = (intended || []).map(e => e?.trim()).filter(Boolean) as string[];

  if (isEmailTestMode()) {
    const to = testRecipient();
    console.log(
      `[EMAIL] TEST MODE active — redirecting ${JSON.stringify(cleaned)} → ${to}. ` +
      `Set EMAIL_TEST_MODE=false to send to real recipients.`,
    );
    return [to];
  }

  return cleaned;
}
