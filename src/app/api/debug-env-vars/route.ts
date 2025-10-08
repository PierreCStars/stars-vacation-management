import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
    NEXT_PUBLIC_ENABLE_FIREBASE_TYPE: typeof process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
    NEXT_PUBLIC_ENABLE_FIREBASE_LENGTH: process.env.NEXT_PUBLIC_ENABLE_FIREBASE?.length,
    NEXT_PUBLIC_ENABLE_FIREBASE_TRIM: process.env.NEXT_PUBLIC_ENABLE_FIREBASE?.trim(),
    NEXT_PUBLIC_ENABLE_FIREBASE_JSON: JSON.stringify(process.env.NEXT_PUBLIC_ENABLE_FIREBASE),
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    FIREBASE_ADMIN_PRIVATE_KEY: process.env.FIREBASE_ADMIN_PRIVATE_KEY ? 'present' : 'missing',
  };

  return NextResponse.json(envVars, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
