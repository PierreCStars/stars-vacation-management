import { NextResponse } from 'next/server';
import { runPendingCheck, PendingCheckResult } from '@/lib/cron/pendingRequests';
import { safeNextJson } from '@/lib/http/safeJson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[CRON_7D] Starting 7-day pending requests check...');
    
    const result: PendingCheckResult = await runPendingCheck('7d');
    
    console.log('[CRON_7D] Completed:', result);
    
    return safeNextJson(result, {
      success: true,
      message: '7-day pending requests check completed'
    });
    
  } catch (error) {
    console.error('[CRON_7D] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: '7-day pending requests check failed',
      details: errorMessage
    }, { status: 500 });
  }
}
