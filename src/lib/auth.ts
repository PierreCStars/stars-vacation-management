import { AuthOptions, SessionStrategy } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

// Ensure we have a valid secret
const getSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.warn("NEXTAUTH_SECRET not set, using fallback secret");
    return "fallback-secret-for-development-only";
  }
  return secret;
};

export const authOptions: AuthOptions = {
  secret: getSecret(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "select_account",
          hd: "stars.mc"  // Restrict to stars.mc Google Workspace domain
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ profile }: any) {
      const email = profile?.email;
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
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  pages: {
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === "development",
}; 