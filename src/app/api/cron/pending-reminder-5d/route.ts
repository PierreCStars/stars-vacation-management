import { NextResponse } from 'next/server';
import { runPendingReminder5d, ReminderResult } from '@/lib/cron/pendingReminder5d';
import { safeNextJson } from '@/lib/http/safeJson';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * Cron endpoint for 5-day pending vacation request reminders
 * 
 * Schedule: Daily at 08:00 UTC (09:00 Europe/Monaco)
 * Vercel Cron: 0 8 * * * (runs daily at 8:00 AM UTC)
 * 
 * Note: The code checks if 5 days have passed since last reminder, so it only
 * sends reminders when appropriate, even though the cron runs daily.
 * 
 * This endpoint:
 * 1. Finds pending vacation requests that haven't been reminded in the last 5 days
 * 2. Sends a reminder email to all admins with the list of pending requests
 * 3. Updates lastRemindedAt timestamp for included requests
 * 
 * Environment variables:
 * - REMINDER_ENABLED: Set to 'false' to disable reminders (default: true)
 */
export async function GET() {
  try {
    console.log('[CRON_5D] Starting 5-day pending reminder check...');
    
    const result: ReminderResult = await runPendingReminder5d();
    
    if (result.included === 0) {
      console.log('[CRON_5D] No pending requests need reminder');
      return safeNextJson(result, {
        success: true,
        message: 'No pending requests need reminder'
      });
    }
    
    console.log(`[CRON_5D] ✅ Reminder process completed: ${result.included} requests included, ${result.notified} admins notified`);
    
    return safeNextJson(result, {
      success: result.success,
      message: `Reminder sent for ${result.included} pending request${result.included !== 1 ? 's' : ''}`
    });
    
  } catch (error) {
    console.error('[CRON_5D] ❌ Error in 5-day reminder check:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Allow POST for manual triggering
export async function POST() {
  return GET();
}

