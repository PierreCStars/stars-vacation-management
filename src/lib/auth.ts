import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

// Ensure we have a valid secret
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn('NEXTAUTH_SECRET is missing; using fallback only in DEV.');
    return "fallback-secret-for-development-only";
  }
  return secret;
};

const isPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = process.env.NODE_ENV === 'development';

export const authOptions: AuthOptions = {
  secret: getSecret(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(isPreview || isDevelopment
      ? [
          CredentialsProvider({
            name: 'Development Login',
            credentials: {
              username: { label: 'Email', type: 'text' },
              password: { label: 'Password', type: 'password' }
            },
            async authorize(creds) {
              // For development, allow any @stars.mc email with any password
              if (creds?.username?.endsWith('@stars.mc')) {
                return { 
                  id: 'dev-user', 
                  name: 'Development User', 
                  email: creds.username 
                } as any;
              }
              return null;
            }
          })
        ]
      : [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
                access_type: "offline",
                prompt: "consent", // Force consent to get refresh token
                hd: "stars.mc"  // Restrict to stars.mc Google Workspace domain
              }
            }
          })
        ])
  ],
  callbacks: {
    async signIn({ profile, user }: any) {
      // In preview or development, credentials provider already validated
      if (isPreview || isDevelopment) return true;
      const email = profile?.email || user?.email;
      const domain = email?.split('@')[1];
      if (domain !== "stars.mc") {
        console.log(`Access denied for domain: ${domain}`);
        return false;
      }
      console.log(`Access granted for user: ${email}`);
      return true;
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.sub;
        // Add calendar access info to session
        session.user.hasCalendarAccess = (token as any).hasCalendarAccess || false;
      }
      return session;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.sub = (user as any).id;
      }
      // Store calendar access scope in token (Google only)
      if (account?.scope) {
        (token as any).hasCalendarAccess = account.scope.includes('https://www.googleapis.com/auth/calendar.readonly');
      }
      return token;
    },
  },
  pages: {
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === "development",
}; 