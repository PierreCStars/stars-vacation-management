export const dynamic = "force-dynamic";
export const runtime = 'nodejs';
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getAnalyticsSourceInfo } from '@/lib/analytics/data';

export async function GET() {
  try {
    console.info('[ANALYTICS] source=firebase query=source-check');
    
    const sourceInfo = await getAnalyticsSourceInfo();
    
    return NextResponse.json({
      ...sourceInfo,
      timestamp: new Date().toISOString(),
      message: 'Analytics data source verification'
    });
  } catch (error) {
    console.error('[ANALYTICS] source=firebase error=source-check failed', error);
    
    return NextResponse.json({
      source: 'error',
      firebaseAvailable: false,
      totalRequests: 0,
      sampleIds: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
