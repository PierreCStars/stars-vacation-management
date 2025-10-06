import { NextResponse } from 'next/server';
import { runPendingCheck } from '@/lib/cron/pendingRequests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[CRON_3D] Starting 3-day pending requests check...');
    
    const result = await runPendingCheck('3d');
    
    console.log('[CRON_3D] Completed:', result);
    
    return NextResponse.json({
      success: true,
      message: '3-day pending requests check completed',
      ...result
    });
    
  } catch (error) {
    console.error('[CRON_3D] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '3-day pending requests check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
