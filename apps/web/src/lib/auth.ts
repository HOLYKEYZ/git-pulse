import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile }) {
      // call the base config logic if any
      if (authConfig.callbacks.jwt) {
        // @ts-ignore
        token = await authConfig.callbacks.jwt({ token, profile });
      }

      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.githubId = account.providerAccountId;

        // upsert user in db on every login - only runs on server
        try {
          const user = await prisma.user.upsert({
            where: { githubId: account.providerAccountId },
            update: {
              username: (profile as any).login,
              name: profile.name ?? null,
              email: profile.email ?? null,
              avatar: (profile as any).avatar_url ?? profile.image ?? null,
              bio: (profile as any).bio ?? null
            },
            create: {
              githubId: account.providerAccountId,
              username: (profile as any).login,
              name: profile.name ?? null,
              email: profile.email ?? null,
              avatar: (profile as any).avatar_url ?? profile.image ?? null,
              bio: (profile as any).bio ?? null
            }
          });
          token.dbId = user.id;
        } catch (error) {
          console.error("❌ [Auth] Failed to upsert user:", error);
        }
      }
      return token;
    }
  }
});