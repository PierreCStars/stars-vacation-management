// Debug route to check environment variables
// Only accessible in development mode

export const runtime = 'nodejs';

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not available in production' }, { status: 403 });
  }

  const envCheck = {
    // Firebase Admin
    FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Present' : '❌ Missing',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '❌ Missing',
    
    // Firebase Client
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Present' : '❌ Missing',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Missing',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Missing',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ Missing',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '❌ Missing',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '❌ Missing',
    NEXT_PUBLIC_ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE || '❌ Missing',
    
    // NextAuth
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Present' : '❌ Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ Missing',
    
    // Google OAuth
    GOOGLE_ID: process.env.GOOGLE_ID ? '✅ Present' : '❌ Missing',
    GOOGLE_SECRET: process.env.GOOGLE_SECRET ? '✅ Present' : '❌ Missing',
    
    // Google Calendar
    GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_KEY ? '✅ Present' : '❌ Missing',
    
    // Gmail
    GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID ? '✅ Present' : '❌ Missing',
    GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET ? '✅ Present' : '❌ Missing',
    GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN ? '✅ Present' : '❌ Missing',
    
    // SMTP
    SMTP_HOST: process.env.SMTP_HOST || '❌ Missing',
    SMTP_PORT: process.env.SMTP_PORT || '❌ Missing',
    SMTP_USER: process.env.SMTP_USER ? '✅ Present' : '❌ Missing',
    SMTP_PASS: process.env.SMTP_PASS ? '✅ Present' : '❌ Missing',
    
    // Environment info
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV || 'local',
    timestamp: new Date().toISOString()
  };

  return Response.json(envCheck, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

