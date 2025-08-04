import { NextResponse } from 'next/server';
import { getAllVacationRequests } from '@/lib/firebase';

export async function GET() {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    // Test Firebase connection without authentication
    const requests = await getAllVacationRequests();
    
    console.log('✅ Firebase connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Firebase connection working',
      requestCount: requests.length,
      sampleData: requests.slice(0, 2) // Return first 2 requests as sample
    });
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Firebase connection failed'
    }, { status: 500 });
  }
} 