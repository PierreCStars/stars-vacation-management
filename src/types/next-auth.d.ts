
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      hasCalendarAccess?: boolean;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    hasCalendarAccess?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    picture: string;
    hasCalendarAccess?: boolean;
  }
} 