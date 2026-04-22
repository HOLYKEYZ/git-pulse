import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
    authorization: { params: { scope: "user user:email public_repo user:follow", prompt: "select_account" } }
  })],

callbacks: {
  // we'll move the db dependant parts to the main auth.ts
  async jwt({ token, profile }) {
    try {
      if (profile) {
        token.login = (profile as any).login as string;
      }
      return token;
    } catch (error) {
      console.error('Error in jwt callback:', error);
      throw error;
    }
  },
  async session({ session, token }) {
    try {
      if (session.user) {
        // @ts-ignore — accessToken is intentionally NOT sent to the client for security
        // server-side code should fetch from db via prisma.user.findUnique({ select: { accessToken } })
        session.user.githubId = token.githubId as string;
        // @ts-ignore
        session.user.login = token.login as string;
        // @ts-ignore
        session.user.id = token.dbId as string;
      }
      return session;
    } catch (error) {
      console.error('Error in session callback:', error);
      throw error;
    }
  }
},
  pages: {
    signIn: '/login',
    signOut: '/signout',
  }
} satisfies NextAuthConfig;