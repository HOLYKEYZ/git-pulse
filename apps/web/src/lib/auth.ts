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
async jwt({ token, account, profile, user, isNewUser }: any) {
  // Basic validation for profile and account
  if (!profile || !account) {
    throw new Error('Invalid authentication data');
  }
  // Sanitize and validate user data
  const userData = {
    username: profile.login,
    name: profile.name ?? null,
    email: profile.email ?? null,
    avatar: profile.avatar_url ?? profile.image ?? null,
    bio: profile.bio ?? null,
    accessToken: account.access_token ?? null
  };
  // Validate against expected formats and content
  if (!userData.username || typeof userData.username !== 'string') {
    throw new Error('Invalid username');
  }
  // ... additional validation for other fields as needed
      // call the base config logic if any
      if (authConfig.callbacks.jwt) {
        token = await authConfig.callbacks.jwt({ token, account, profile, user, isNewUser });
      }

      if (account && profile) {
        token.accessToken = account.access_token as string;
        token.githubId = account.providerAccountId;

        // upsert user in db on every login - only runs on server
        try {
          const userData: any = {
              username: profile.login,
              name: profile.name ?? null,
              email: profile.email ?? null,
              avatar: profile.avatar_url ?? profile.image ?? null,
              bio: profile.bio ?? null,
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
// Log or handle any errors appropriately
try {
} catch (error) {
  console.error('Error upserting user:', error);
}
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