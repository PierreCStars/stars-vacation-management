import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hasServiceAccountKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const hasCalendarId = !!process.env.GOOGLE_CALENDAR_ID;
    
    let serviceAccountInfo = null;
    if (hasServiceAccountKey) {
      try {
        const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        serviceAccountInfo = {
          hasClientEmail: !!key.client_email,
          hasPrivateKey: !!key.private_key,
          clientEmail: key.client_email,
          projectId: key.project_id,
        };
      } catch (error) {
        serviceAccountInfo = {
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
    
    return NextResponse.json({
      success: true,
      environment: {
        hasServiceAccountKey,
        hasCalendarId,
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        serviceAccountInfo,
      },
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 