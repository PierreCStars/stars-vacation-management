import { z } from 'zod';

const EnvSchema = z.object({
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID missing'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET missing'),
  
  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a URL'),
  NEXTAUTH_SECRET: z.string().min(1, 'NEXTAUTH_SECRET missing'),
  
  // Firebase (if used)
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_PROJECT_ID missing'),
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_API_KEY missing'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN missing'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET missing'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID missing'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'NEXT_PUBLIC_FIREBASE_APP_ID missing'),
  
  // Firebase Admin (server-side)
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID missing'),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT_KEY missing'),
  
  // Gmail API
  GMAIL_CLIENT_ID: z.string().min(1, 'GMAIL_CLIENT_ID missing'),
  GMAIL_CLIENT_SECRET: z.string().min(1, 'GMAIL_CLIENT_SECRET missing'),
  GMAIL_REFRESH_TOKEN: z.string().min(1, 'GMAIL_REFRESH_TOKEN missing'),
  
  // Optional but recommended
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VERCEL_URL: z.string().optional(),
});

const _env = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL,
};

const parsed = EnvSchema.safeParse(_env);

export class StartupConfigError extends Error {
  constructor(msg: string, public issues?: unknown) {
    super(msg);
    this.name = 'StartupConfigError';
  }
}

if (!parsed.success) {
  // Log the validation errors but don't crash immediately
  console.error('Environment validation failed:', parsed.error.flatten());
  
  // In development, show more detailed error info
  if (process.env.NODE_ENV === 'development') {
    console.error('Missing environment variables:', parsed.error.issues);
  }
}

export const env = new Proxy(_env as Record<string, string | undefined>, {
  get(target, prop: string) {
    if (!parsed.success) {
      throw new StartupConfigError('Missing/invalid environment configuration', parsed.error.flatten());
    }
    const val = target[prop];
    if (!val) {
      throw new StartupConfigError(`Required env var ${prop} is missing`);
    }
    return val;
  },
});

// Export the parsed environment for type safety
export type Env = z.infer<typeof EnvSchema>;
