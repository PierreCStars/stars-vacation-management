import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { assertRequiredEnv } from "@/lib/env/required";
import { isAdmin } from '@/config/admins';

// Validate required environment variables at module load time
assertRequiredEnv();

// Ensure we have a valid secret
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required but not set');
  }
  return secret;
};

const isPreview = process.env.VERCEL_ENV === 'preview';
const isDevelopment = process.env.NODE_ENV === 'development';

// Policy configuration from environment variables
const ALLOW_DOMAIN = process.env.NEXTAUTH_ALLOW_DOMAIN; // e.g., "stars.mc"
const ALLOW_EMAILS = (process.env.NEXTAUTH_ALLOW_EMAILS ?? "")
  .split(",")
  .map(s => s.trim().toLowerCase())
  .filter(Boolean);

/**
 * Determines if an email is allowed based on domain and email allowlists
 * @param email - Email address to check
 * @returns true if email is allowed
 */
function isAllowedEmail(email?: string | null): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  
  // Check explicit email allowlist first
  if (ALLOW_EMAILS.length && ALLOW_EMAILS.includes(e)) return true;
  
  // Check domain allowlist
  if (ALLOW_DOMAIN && e.endsWith(`@${ALLOW_DOMAIN.toLowerCase()}`)) return true;
  
  // If no policy is set, allow by default (backward compatibility)
  return ALLOW_DOMAIN ? false : true;
}

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
              // For development, only allow specific admin emails
              if (creds?.username && isAdmin(creds.username)) {
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
                prompt: "consent" // Force consent to get refresh token
                // Note: Removed hd restriction to allow policy-based filtering instead
              }
            }
          })
        ])
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      try {
        // In preview or development, credentials provider already validated
        if (isPreview || isDevelopment) {
          console.log("[auth] signIn granted", {
            reason: "development_mode",
            email: user?.email,
            provider: account?.provider
          });
          return true;
        }

        const userEmail = profile?.email || user?.email;
        
        // Check both admin list and policy-based allowlist
        const isAdminUser = isAdmin(userEmail);
        const isPolicyAllowed = isAllowedEmail(userEmail);
        
        if (!isAdminUser && !isPolicyAllowed) {
          console.warn("[auth] signIn denied", {
            reason: "policy",
            email: userEmail,
            isAdmin: isAdminUser,
            isPolicyAllowed: isPolicyAllowed,
            allowDomain: ALLOW_DOMAIN,
            allowEmails: ALLOW_EMAILS,
            provider: account?.provider,
            timestamp: new Date().toISOString()
          });
          return false; // triggers AccessDenied
        }

        console.log("[auth] signIn granted", {
          reason: isAdminUser ? "admin_list" : "policy",
          email: userEmail,
          isAdmin: isAdminUser,
          isPolicyAllowed: isPolicyAllowed,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        });
        
        return true;
      } catch (err) {
        console.error("[auth] signIn exception", { 
          error: err instanceof Error ? err.message : String(err),
          email: user?.email,
          provider: account?.provider,
          timestamp: new Date().toISOString()
        });
        return false;
      }
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