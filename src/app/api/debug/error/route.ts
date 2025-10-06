import { NextRequest, NextResponse } from 'next/server';
import { errorLogger } from '@/lib/error-logger';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const digest = searchParams.get('digest');

  if (digest) {
    // Get specific error by digest
    const error = errorLogger.getError(digest);
    if (error) {
      return NextResponse.json({
        found: true,
        error,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        found: false,
        message: `No error found with digest: ${digest}`,
        timestamp: new Date().toISOString()
      }, { status: 404 });
    }
  } else {
    // Get all errors
    const errors = errorLogger.getAllErrors();
    return NextResponse.json({
      count: errors.length,
      errors: errors.slice(-10), // Last 10 errors
      timestamp: new Date().toISOString()
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, url, userAgent } = body;
    
    // Create a mock error for testing
    const error = new Error(message || 'Test error');
    if (stack) error.stack = stack;
    
    const digest = errorLogger.logError(error, {
      url: url || 'unknown',
      userAgent: userAgent || 'unknown',
    });

    return NextResponse.json({
      success: true,
      digest,
      message: 'Error logged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to log error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}







