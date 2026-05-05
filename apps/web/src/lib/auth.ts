import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { z } from "zod";

const ProfileSchema = z.object({
  login: z.string().min(1),
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
      if (authConfig.callbacks.jwt) {
        token = await authConfig.callbacks.jwt({ token, account, profile, user, isNewUser });
      }

      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.githubId = account.providerAccountId;

        const parsedProfileResult = ProfileSchema.safeParse(profile);
        if (!parsedProfileResult.success) {
          console.error("[Auth] Invalid GitHub profile payload:", parsedProfileResult.error);
          return token;
        }

        const githubId = z.string().min(1).parse(account.providerAccountId);
        const validProfile = parsedProfileResult.data;
        const userData = {
          username: validProfile.login,
          name: validProfile.name ?? null,
          email: validProfile.email ?? null,
          avatar: validProfile.avatar_url ?? validProfile.image ?? null,
          bio: validProfile.bio ?? null,
          accessToken: account.access_token ?? null,
        };

        try {
          const dbUser = await prisma.user.upsert({
            where: { githubId },
            update: userData,
            create: {
              githubId,
              ...userData,
            },
          });
          token.dbId = dbUser.id;
        } catch (error) {
          console.error("[Auth] Failed to upsert user:", error);
          throw new Error("Failed to upsert user");
        }
      }

      return token;
    },
  },
});
