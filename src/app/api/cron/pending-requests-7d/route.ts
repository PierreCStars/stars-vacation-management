import { NextResponse } from 'next/server';
import { runPendingCheck } from '@/lib/cron/pendingRequests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[CRON_7D] Starting 7-day pending requests check...');
    
    const result = await runPendingCheck('7d');
    
    console.log('[CRON_7D] Completed:', result);
    
    return NextResponse.json({
      success: true,
      message: '7-day pending requests check completed',
      ...result
    });
    
  } catch (error) {
    console.error('[CRON_7D] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '7-day pending requests check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
