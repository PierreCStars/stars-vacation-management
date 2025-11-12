import { NextResponse } from 'next/server';
import { runPendingCheck, PendingCheckResult } from '@/lib/cron/pendingRequests';
import { safeNextJson } from '@/lib/http/safeJson';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[CRON_3D] Starting 3-day pending requests check...');
    
    const result: PendingCheckResult = await runPendingCheck('3d');
    
    console.log('[CRON_3D] Completed:', result);
    
    return safeNextJson(result, {
      success: true,
      message: '3-day pending requests check completed'
    });
    
  } catch (error) {
    console.error('[CRON_3D] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      success: false,
      error: '3-day pending requests check failed',
      details: errorMessage
    }, { status: 500 });
  }
}
