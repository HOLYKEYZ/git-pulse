import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      githubId: string;
      login: string; // github username
      // note: accessToken is intentionally NOT included here — it lives in the DB only
    } & DefaultSession["user"];
  }

  interface Profile {
    login?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string; // still stored in the jwt for the server-side upsert flow
    githubId: string;
    login: string;
    dbId: string;
  }
}