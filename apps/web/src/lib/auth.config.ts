import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "./prisma";
import { comparePassword } from "./password";
import { z } from "zod";

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
        const parsedCredentials = CredentialsSchema.safeParse(credentials);
        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;
        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!dbUser?.password) return null;

        const passwordMatches = await comparePassword(password, dbUser.password);
        if (!passwordMatches) return null;

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          image: dbUser.avatar,
          login: dbUser.username ?? dbUser.email ?? dbUser.id,
          githubId: dbUser.githubId ?? "",
        };
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, profile, user }) {
      if (profile?.login) {
        token.login = profile.login;
      }
      if (user) {
        const authUser = user as typeof user & { login?: string; githubId?: string };
        token.dbId = authUser.id;
        token.email = authUser.email;
        token.name = authUser.name;
        token.picture = authUser.image;
        token.login = authUser.login ?? token.login;
        token.githubId = authUser.githubId ?? token.githubId;
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
