/**
 * Environment validation utility for server-side only
 * Throws clear errors if required environment variables are missing
 */

const REQUIRED_ENV_VARS = [
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

const FIREBASE_ENV_VARS = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_ADMIN_CLIENT_EMAIL',
  'FIREBASE_ADMIN_PRIVATE_KEY',
] as const;

export function assertRequiredEnv(): void {
  const missing: string[] = [];
  
  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your .env.local file or Vercel environment variables.\n` +
      `Required: ${REQUIRED_ENV_VARS.join(', ')}`
    );
  }
  
  console.log('✅ All required environment variables are present');
}

export function assertFirebaseEnv(): void {
  if (process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true') {
    console.log('🔧 Firebase is disabled (NEXT_PUBLIC_ENABLE_FIREBASE !== true)');
    return;
  }
  
  const missing: string[] = [];
  
  for (const envVar of FIREBASE_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `❌ Firebase is enabled but missing required environment variables: ${missing.join(', ')}\n` +
      `Please set these in your .env.local file or Vercel environment variables.\n` +
      `Required for Firebase: ${FIREBASE_ENV_VARS.join(', ')}`
    );
  }
  
  console.log('✅ Firebase environment variables are present');
}

export function getEnvStatus() {
  const firebaseEnabledValue = process.env.NEXT_PUBLIC_ENABLE_FIREBASE;
  console.log('🔍 Debug: NEXT_PUBLIC_ENABLE_FIREBASE value:', JSON.stringify(firebaseEnabledValue));
  console.log('🔍 Debug: typeof:', typeof firebaseEnabledValue);
  console.log('🔍 Debug: === "true":', firebaseEnabledValue === 'true');
  
  const status = {
    required: {} as Record<string, boolean>,
    firebase: {} as Record<string, boolean>,
    firebaseEnabled: firebaseEnabledValue === 'true',
    debug: {
      firebaseEnabledValue,
      type: typeof firebaseEnabledValue,
      strictEqual: firebaseEnabledValue === 'true'
    }
  };
  
  for (const envVar of REQUIRED_ENV_VARS) {
    status.required[envVar] = !!process.env[envVar];
  }
  
  for (const envVar of FIREBASE_ENV_VARS) {
    status.firebase[envVar] = !!process.env[envVar];
  }
  
  return status;
}
