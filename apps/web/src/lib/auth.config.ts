import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "user user:email public_repo user:follow",
          prompt: "select_account",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // This will be handled in auth.ts during the callback
        // Just return null here - we'll validate in the jwt callback
        return null;
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, profile }) {
      if (profile?.login) {
        token.login = profile.login;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.githubId = typeof token.githubId === "string" ? token.githubId : "";
        session.user.login = typeof token.login === "string" ? token.login : "";
        session.user.id = typeof token.dbId === "string" ? token.dbId : "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/signout",
  },
} satisfies NextAuthConfig;
