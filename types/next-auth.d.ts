import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  type UserRole = "admin" | "user";

  interface Session {
    user: {
      role?: UserRole;
      hasCalendarAccess?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: UserRole;
    hasCalendarAccess?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "user";
    hasCalendarAccess?: boolean;
  }
}
