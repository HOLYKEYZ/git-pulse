import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "./prisma";
import { comparePassword } from "./password";
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
    async jwt({ token, account, profile, user, isNewUser, credentials }: any) {
      if (authConfig.callbacks.jwt) {
        token = await authConfig.callbacks.jwt({ token, account, profile, user, isNewUser });
      }

      // Handle GitHub OAuth
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
          const existingUser = validProfile.email
            ? await prisma.user.findUnique({ where: { email: validProfile.email } })
            : null;
          const dbUser = existingUser
            ? await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                  githubId,
                  username: validProfile.login,
                  name: userData.name ?? existingUser.name,
                  avatar: userData.avatar,
                  bio: userData.bio,
                  accessToken: userData.accessToken,
                },
              })
            : await prisma.user.upsert({
                where: { githubId },
                update: userData,
                create: {
                  githubId,
                  ...userData,
                },
              });
          token.dbId = dbUser.id;
          token.login = dbUser.username ?? token.login;
          token.githubId = dbUser.githubId ?? token.githubId;
        } catch (error) {
          console.error("[Auth] Failed to upsert user:", error);
          return token;
        }
      }

      // Handle Credentials (email/password)
      if (credentials && account?.provider === "credentials") {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!dbUser || !dbUser.password) {
            console.error("[Auth] User not found or has no password");
            throw new Error("Invalid credentials");
          }

          const passwordMatch = await comparePassword(credentials.password, dbUser.password);
          if (!passwordMatch) {
            console.error("[Auth] Password mismatch for user:", credentials.email);
            throw new Error("Invalid credentials");
          }

          token.dbId = dbUser.id;
          token.email = dbUser.email;
        } catch (error) {
          console.error("[Auth] Credentials authentication failed:", error);
          throw new Error("Authentication failed");
        }
      }

      // Handle user data from callback (already authenticated user)
      if (user && !account) {
        token.dbId = (user as any).id;
        token.email = (user as any).email;
      }

      return token;
    },
  },
});
