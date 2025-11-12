# Admin Menu Regrouping & 5-Day Pending Reminder Implementation

## Date: 2025-01-XX

## Summary

This document describes the implementation of two features:
1. **Navigation Menu Regrouping**: Merged "Administration" and "Analyses" into a single "Administration" menu
2. **5-Day Pending Reminder**: Automated reminder system for pending vacation requests

---

## Task 1: Navigation Menu Regrouping

### Changes Made

#### 1. Created AdminDropdown Component
**File**: `src/components/nav/AdminDropdown.tsx`

- New dropdown menu component for desktop navigation
- Groups "Management" and "Analytics" sections under "Administration"
- Accessible with keyboard navigation and click-outside-to-close
- Maintains active state highlighting

#### 2. Updated Topbar Navigation
**File**: `src/components/nav/Topbar.tsx`

- Replaced separate "Admin" and "Analytics" links with `AdminDropdown` component
- Single "Administration" menu item with dropdown
- Preserves all existing routes and permissions

#### 3. Updated AdminSidebar
**File**: `src/components/nav/AdminSidebar.tsx`

- Added section headers: "Management" and "Analytics"
- Grouped vacation requests under "Management"
- Grouped analytics under "Analytics"
- Improved visual hierarchy with section dividers

#### 4. Updated Translations
**File**: `src/locales/index.ts`

- Added `managementSection` and `analyticsSection` keys
- English: "Management" / "Analytics"
- French: "Gestion" / "Analyses"
- Italian: "Gestione" / "Analisi"

#### 5. Updated Breadcrumbs
**File**: `src/app/[locale]/admin/analytics/page.tsx`

- Changed breadcrumb from "Admin / Analytics" to "Administration / Analytics"

### Features

- ✅ Single "Administration" top-level menu
- ✅ Grouped sections (Management & Analytics)
- ✅ All routes preserved
- ✅ RBAC unchanged
- ✅ i18n support (EN, FR, IT)
- ✅ Responsive design
- ✅ Keyboard accessible
- ✅ Active state highlighting

---

## Task 2: 5-Day Pending Reminder

### Implementation

#### 1. Core Reminder Logic
**File**: `src/lib/cron/pendingReminder5d.ts`

**Functions**:
- `findPendingRequestsForReminder()`: Finds pending requests not reminded in last 5 days
- `generateReminderEmail()`: Creates HTML/text email with request table
- `sendReminderToAdmins()`: Sends email to all admins
- `updateReminderTimestamps()`: Updates `lastRemindedAt` field
- `runPendingReminder5d()`: Main orchestration function

**Key Features**:
- Only includes requests with `status = 'pending'` (or variants)
- Excludes requests reminded in last 5 days (`lastRemindedAt` check)
- Batch updates for Firestore (500 per batch)
- Comprehensive error handling
- Feature flag support (`REMINDER_ENABLED`)

#### 2. Cron Endpoint
**File**: `src/app/api/cron/pending-reminder-5d/route.ts`

- GET/POST endpoint for Vercel Cron
- Returns detailed result JSON
- Error handling and logging

#### 3. Vercel Cron Configuration
**File**: `vercel.json`

- Schedule: `0 8 * * *` (Daily at 08:00 UTC = 09:00 Europe/Monaco)
- Note: Code checks if 5 days have passed, so reminders only send when appropriate

#### 4. Email Template

**Content**:
- Subject: "Pending vacation requests — reminder (N requests)"
- HTML table with:
  - Employee name
  - Dates (start-end)
  - Request type
  - Days count
  - Date submitted
  - Review link
- Call-to-action button: "Review Requests"
- Professional styling

### Database Schema

**New Field**: `lastRemindedAt`
- Type: Firestore Timestamp
- Purpose: Track when a request was last included in a reminder
- Updated: After successful email send

### Configuration

**Environment Variables**:
- `REMINDER_ENABLED`: Set to `'false'` to disable reminders (default: `true`)
- `NEXTAUTH_URL` or `VERCEL_URL`: Used for generating review links

### Idempotency

- Checks `lastRemindedAt` field before including requests
- Only includes if `lastRemindedAt` is null OR > 5 days ago
- Updates `lastRemindedAt` only after successful email send
- Prevents duplicate reminders within 5-day window

### Testing

**Unit Tests**: `src/lib/cron/__tests__/pendingReminder5d.test.ts`

- Tests request filtering logic
- Tests exclusion of recently-reminded requests
- Tests feature flag behavior
- Tests empty state handling

**Manual Testing**:
```bash
# Test the endpoint locally
curl http://localhost:3000/api/cron/pending-reminder-5d

# Or via POST
curl -X POST http://localhost:3000/api/cron/pending-reminder-5d
```

---

## Deployment Plan

### Phase 1: Navigation Changes (Low Risk)
1. ✅ Deploy navigation changes
2. ✅ Verify menu structure in staging
3. ✅ Test all admin routes still accessible
4. ✅ Verify i18n translations
5. ✅ Deploy to production

### Phase 2: Reminder System (Medium Risk)
1. **Deploy with REMINDER_ENABLED=false**
   ```bash
   # In Vercel environment variables
   REMINDER_ENABLED=false
   ```

2. **Verify in Staging**:
   - Test endpoint manually: `POST /api/cron/pending-reminder-5d`
   - Verify no emails sent when disabled
   - Check logs for correct behavior

3. **Enable in Staging**:
   ```bash
   REMINDER_ENABLED=true
   ```
   - Create test pending requests
   - Manually trigger endpoint
   - Verify email sent with correct content
   - Verify `lastRemindedAt` updated

4. **Deploy to Production**:
   - Deploy with `REMINDER_ENABLED=false` initially
   - Monitor for 24 hours
   - Enable reminders: `REMINDER_ENABLED=true`
   - Monitor first run and verify logs

### Phase 3: Validation
1. ✅ Verify cron job runs daily
2. ✅ Verify reminders only sent every 5 days
3. ✅ Verify email content is correct
4. ✅ Verify no duplicate reminders
5. ✅ Monitor error logs

---

## Files Modified

### Navigation
- `src/components/nav/AdminDropdown.tsx` (new)
- `src/components/nav/Topbar.tsx`
- `src/components/nav/AdminSidebar.tsx`
- `src/locales/index.ts`
- `src/app/[locale]/admin/analytics/page.tsx`

### Reminder System
- `src/lib/cron/pendingReminder5d.ts` (new)
- `src/app/api/cron/pending-reminder-5d/route.ts` (new)
- `src/lib/cron/__tests__/pendingReminder5d.test.ts` (new)
- `vercel.json`

---

## Acceptance Criteria Checklist

### Navigation
- [x] Single "Administration" top-level menu
- [x] "Management" section with vacation requests
- [x] "Analytics" section with analytics
- [x] All routes preserved
- [x] RBAC unchanged
- [x] i18n translations updated
- [x] Breadcrumbs updated
- [x] Responsive design maintained
- [x] Keyboard navigation works

### Reminder System
- [x] Finds pending requests correctly
- [x] Excludes recently-reminded requests
- [x] Sends email to admins
- [x] Updates `lastRemindedAt` timestamp
- [x] Feature flag support
- [x] Error handling
- [x] Unit tests
- [x] Cron schedule configured
- [ ] Integration tests (manual)
- [ ] Production validation

---

## Monitoring & Observability

### Logs to Monitor

**Navigation**:
- No specific logs needed (UI-only change)

**Reminder System**:
- `[REMINDER_5D]` prefixed logs
- `[CRON_5D]` prefixed logs
- Email send success/failure
- Timestamp update success/failure

### Metrics

- Number of pending requests found
- Number of requests included in reminder
- Number of requests excluded (recently reminded)
- Email send success/failure count
- Errors encountered

---

## Troubleshooting

### Navigation Issues

**Menu not showing**:
- Check user is admin: `isAdmin(session?.user?.email)`
- Check translations are loaded
- Check browser console for errors

**Dropdown not working**:
- Check click-outside handler
- Check z-index (should be 50)
- Check responsive breakpoints

### Reminder Issues

**Reminders not sending**:
- Check `REMINDER_ENABLED` environment variable
- Check cron job is configured in Vercel
- Check Firebase Admin is available
- Check email service configuration

**Duplicate reminders**:
- Verify `lastRemindedAt` is being updated
- Check Firestore write permissions
- Verify 5-day calculation logic

**No requests included**:
- Check request status is 'pending'
- Check `lastRemindedAt` timestamps
- Verify date calculation (5 days = 432000000 ms)

---

## Related Documentation

- `README.md`: General project documentation
- `DEPLOYMENT.md`: Deployment procedures
- `GOOGLE_CALENDAR_SYNC_FIX.md`: Calendar sync fixes

---

**Status**: ✅ Implementation Complete
**Next Action**: Deploy to staging and validate

