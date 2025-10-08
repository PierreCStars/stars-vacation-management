import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE,
    FIREBASE_ADMIN_CLIENT_EMAIL: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    hasPrivateKey: !!process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    privateKeyLength: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0,
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}