import { NextResponse } from 'next/server';
import { addVacationToCalendar } from '@/lib/google-calendar';

export async function GET() {
  try {
    console.log('🧪 Testing calendar integration in production...');
    
    // Test calendar integration with a sample vacation event
    const testEvent = {
      userName: 'Test User',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      type: 'VACATION',
      company: 'STARS_MC',
      reason: 'Test calendar integration',
    };
    
    const eventId = await addVacationToCalendar(testEvent);
    
    return NextResponse.json({
      success: true,
      message: 'Calendar integration test completed',
      eventId: eventId,
      testEvent: testEvent,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Calendar integration test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Calendar integration test failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 