export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { processMonthlySummary } from "./process-monthly-summary";

export async function GET(req: Request) {
  try {
    // Only send on the 27th of the current month (Europe/Monaco timezone)
    // CRITICAL: Check date in Monaco timezone, not UTC
    const now = new Date();
    const monacoDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Monaco',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(now);
    
    const day = parseInt(monacoDate.find(p => p.type === 'day')!.value);
    
    if (day !== 27) {
      return NextResponse.json({ 
        ok: true, 
        skipped: true, 
        reason: "Not 27th of month - monthly summary runs on the 27th to summarize current month",
        currentDate: now.toISOString(),
        currentDay: day,
        timezone: 'Europe/Monaco'
      });
    }

    // Use shared processing function (ensures timezone correctness and no deduplication)
    const result = await processMonthlySummary(false);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in monthly summary API (GET):', error);
    return NextResponse.json(
      { error: 'Failed to process monthly summary' },
      { status: 500 }
    );
  }
}

// POST endpoint for manual trigger (bypasses date check)
export async function POST(req: Request) {
  try {
    console.log('📧 POST /api/cron/monthly-vacation-summary called');
    // Allow manual triggering without date restriction
    // Use shared processing function (ensures timezone correctness and no deduplication)
    const result = await processMonthlySummary(true);
    console.log('📧 processMonthlySummary completed, result.ok:', result.ok, 'emailSent:', result.emailSent);
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Error in monthly summary API (POST):', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('❌ Error details:', { message: errorMessage, stack: errorStack });
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to process monthly summary',
        details: errorMessage,
        emailSent: false,
        emailError: errorMessage
      },
      { status: 500 }
    );
  }
}
