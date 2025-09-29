import { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const allowedDomain = process.env.AUTH_ALLOWED_DOMAIN || "stars.mc";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { prompt: "select_account", hd: allowedDomain } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      const email = (profile?.email || "").toLowerCase();
      const hd = (profile as any)?.hd || "";
      return email.endsWith(`@${allowedDomain}`) || hd === allowedDomain;
    },
  },
  pages: { signIn: "/login" },
};
