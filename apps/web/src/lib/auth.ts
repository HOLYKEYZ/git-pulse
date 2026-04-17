import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";
import { Account, User } from "next-auth";
import { GitHubProfile } from "next-auth/providers/github";
import { AdapterUser } from "next-auth/adapters";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { z } from "zod";

const ProfileSchema = z.object({
  login: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  avatar_url: z.string().url().nullable().optional(),
  image: z.string().url().nullable().optional(),
  bio: z.string().nullable().optional(),
}).passthrough();

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, account, profile, user, isNewUser }: any) {
      // call the base config logic if any
      if (authConfig.callbacks.jwt) {
        token = await authConfig.callbacks.jwt({ token, account, profile, user, isNewUser });
      }

      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.githubId = account.providerAccountId;

        // upsert user in db on every login - only runs on server
        try {
          const parsedProfileResult = ProfileSchema.safeParse(profile);
          if (!parsedProfileResult.success) {
            console.error("❌ [Auth] Invalid GitHub profile payload:", parsedProfileResult.error);
            return token; // fail gracefully without creating malicious db entries
          }
          const validProfile = parsedProfileResult.data;

          const userData: any = {
              username: validProfile.login,
              name: validProfile.name ?? null,
              email: validProfile.email ?? null,
              avatar: validProfile.avatar_url ?? validProfile.image ?? null,
              bio: validProfile.bio ?? null,
              accessToken: account.access_token ?? null
          };
          
          const user = await prisma.user.upsert({
            where: { githubId: account.providerAccountId },
            update: userData,
            create: {
              githubId: account.providerAccountId,
              ...userData
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