import { NextResponse } from 'next/server';
import { getEnvStatus } from '@/lib/env/required';

export async function GET() {
  try {
    const envStatus = getEnvStatus();
    
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'unknown',
      projectUrl: process.env.VERCEL_PROJECT_PRODUCTION_URL || 'unknown',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'unknown',
      firebaseEnabled: envStatus.firebaseEnabled,
      environment: process.env.NODE_ENV || 'unknown',
      vercelEnv: process.env.VERCEL_ENV || 'unknown',
      envStatus: {
        required: envStatus.required,
        firebase: envStatus.firebase,
      },
      debug: envStatus.debug || null,
      rawEnvVar: process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
    };

    return NextResponse.json(healthData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}