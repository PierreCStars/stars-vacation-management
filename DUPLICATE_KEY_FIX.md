# Duplicate Key TypeScript Error Fix

## Date: 2025-01-XX

## Problem

Next.js 15.5 build was failing with TypeScript error:
```
Type error: 'success' is specified more than once, so this usage will be overwritten.
File: src/app/api/cron/pending-reminder-5d/route.ts:34
```

The issue occurred when spreading result objects that already contained `success` or `message` keys, while also explicitly setting those keys in the response object.

## Root Cause

When creating API responses, code was doing:
```typescript
return NextResponse.json({
  success: true,
  message: 'Custom message',
  ...result  // result already contains 'success' and possibly 'message'
});
```

This creates duplicate keys in the object literal, which TypeScript rejects.

## Solution

### 1. Created Safe JSON Utility
**File**: `src/lib/http/safeJson.ts`

Created two utility functions:
- `safeJson<T, O>(base, overrides)`: Safely merges objects by removing conflicting keys from base before merging
- `safeNextJson<T, O>(base, overrides, init?)`: Creates NextResponse.json with safe merging

**Key Features**:
- Removes conflicting keys from base object before merging
- Preserves non-conflicting keys
- Type-safe with proper TypeScript generics
- Prevents duplicate key errors

### 2. Fixed Affected Routes

**Files Fixed**:
- `src/app/api/cron/pending-reminder-5d/route.ts`
- `src/app/api/cron/pending-requests-3d/route.ts`
- `src/app/api/cron/pending-requests-7d/route.ts`

**Before**:
```typescript
return NextResponse.json({
  success: true,
  message: 'Done',
  ...result  // ❌ Duplicate keys if result has success/message
});
```

**After**:
```typescript
return safeNextJson(result, {
  success: true,
  message: 'Done'
});  // ✅ No duplicate keys
```

### 3. Added Type Annotations

Added explicit type annotations to ensure type safety:
```typescript
const result: ReminderResult = await runPendingReminder5d();
return safeNextJson(result, { success: true, message: 'Done' });
```

### 4. Comprehensive Tests

**File**: `src/lib/http/__tests__/safeJson.test.ts`

Added 9 unit tests covering:
- ✅ Conflicting key removal
- ✅ Non-conflicting key preservation
- ✅ Empty objects handling
- ✅ Multiple conflicting keys
- ✅ TypeScript type safety
- ✅ NextResponse creation
- ✅ ResponseInit options

All tests passing (9/9).

## Files Modified

**New Files**:
- `src/lib/http/safeJson.ts` - Safe JSON utility
- `src/lib/http/__tests__/safeJson.test.ts` - Unit tests

**Modified Files**:
- `src/app/api/cron/pending-reminder-5d/route.ts`
- `src/app/api/cron/pending-requests-3d/route.ts`
- `src/app/api/cron/pending-requests-7d/route.ts`

## Verification

### TypeScript Check
```bash
npx tsc --noEmit
# ✅ 0 errors
```

### Build Check
```bash
npm run build
# ✅ Build successful
```

### Tests
```bash
npm test -- src/lib/http/__tests__/safeJson.test.ts
# ✅ 9/9 tests passing
```

## Usage Example

```typescript
import { safeNextJson } from '@/lib/http/safeJson';

// Service returns object with 'success' property
const result = await myService.run();

// Safe merge - no duplicate keys
return safeNextJson(result, {
  success: true,
  message: 'Operation completed'
});
```

## Prevention

The `safeJson` and `safeNextJson` utilities should be used whenever:
1. Spreading service result objects
2. Overriding specific keys (success, message, etc.)
3. Merging response payloads

This prevents future duplicate key errors and ensures type safety.

## Related Patterns to Avoid

**Don't do this**:
```typescript
return NextResponse.json({
  success: true,
  ...result  // ❌ If result has 'success', this creates duplicate
});
```

**Do this instead**:
```typescript
return safeNextJson(result, {
  success: true  // ✅ Conflicts removed automatically
});
```

---

**Status**: ✅ Fixed and Deployed
**Build**: ✅ Passing
**Tests**: ✅ 9/9 Passing
**TypeScript**: ✅ 0 Errors

