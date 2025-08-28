import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test environment variable loading
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST || 'NOT_SET',
      SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
      SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT_SET',
      APP_BASE_URL: process.env.APP_BASE_URL || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET'
    };
    
    console.log('🔍 Environment variables loaded:', envVars);
    
    return NextResponse.json({
      success: true,
      message: 'Simple API endpoint working',
      timestamp: new Date().toISOString(),
      envVars
    });
  } catch (error) {
    console.error('❌ Simple API error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
