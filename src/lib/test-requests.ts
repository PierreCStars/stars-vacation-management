/**
 * Throwaway "test user" vacation requests.
 *
 * Created from the admin "Create vacation → test user" shortcut. They must be
 * validatable / rejectable for QA (so they are created as PENDING), but must
 * NEVER land in the archives — i.e. excluded from the reviewed list, the CSV
 * export, the Google Sheet export and the monthly accounting summary. A daily
 * cron deletes them after 24h.
 */
export const TEST_USER_EMAIL = 'test@stars.mc';

export function isTestRequest(
  r:
    | { userEmail?: string | null; userId?: string | null; isTestUser?: boolean | null }
    | null
    | undefined,
): boolean {
  if (!r) return false;
  if (r.isTestUser) return true;
  const id = (r.userEmail || r.userId || '').toLowerCase();
  return id === TEST_USER_EMAIL;
}
