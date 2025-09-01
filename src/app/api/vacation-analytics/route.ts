export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextRequest, NextResponse } from 'next/server';
import { getVacationAnalytics, getVacationAnalyticsForPeriod } from '@/lib/vacation-analytics';

export async function GET(request: NextRequest) {
  try {
    // Handle build-time scenario where request.url might be undefined
    if (!request.url) {
      return NextResponse.json({
        success: false,
        error: 'Request URL not available during build time',
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let analytics;
    
    if (startDate && endDate) {
      analytics = await getVacationAnalyticsForPeriod(startDate, endDate);
    } else {
      analytics = await getVacationAnalytics();
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching vacation analytics:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
