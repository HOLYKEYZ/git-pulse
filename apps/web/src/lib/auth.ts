import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { Account, User } from "next-auth";
import { GitHubProfile } from "next-auth/providers/github";
import { AdapterUser } from "next-auth/adapters";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
async jwt({ token, account, profile, user, isNewUser }: { token: JWT; account: Account | null | undefined; profile: GitHubProfile | undefined; user: AdapterUser | User | undefined; isNewUser: boolean | undefined }) {
      // call the base config logic if any
      if (authConfig.callbacks.jwt) {
token = await authConfig.callbacks.jwt({ token, account, profile, user, isNewUser });
      }

      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.githubId = account.providerAccountId;

        // upsert user in db on every login - only runs on server
        try {
          const user = await prisma.user.upsert({
            where: { githubId: account.providerAccountId },
            update: {
username: profile.login,
              name: profile.name ?? null,
              email: profile.email ?? null,
              avatar: profile.avatar_url ?? profile.image ?? null,
              bio: profile.bio ?? null
            },
            create: {
              githubId: account.providerAccountId,
username: profile.login,
              name: profile.name ?? null,
              email: profile.email ?? null,
avatar: profile.avatar_url ?? profile.image ?? null,
bio: profile.bio ?? null
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