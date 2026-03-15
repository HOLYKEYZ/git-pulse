import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import { prisma } from "./prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: { params: { scope: "read:user user:email public_repo" } },
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.accessToken = account.access_token as string;
                token.githubId = account.providerAccountId;
                token.login = (profile as any).login as string;

                // Upsert user in DB on every login
                await prisma.user.upsert({
                    where: { githubId: account.providerAccountId },
                    update: {
                        username: (profile as any).login,
                        name: profile.name ?? null,
                        email: profile.email ?? null,
                        avatar: (profile as any).avatar_url ?? profile.image ?? null,
                        bio: (profile as any).bio ?? null,
                    },
                    create: {
                        githubId: account.providerAccountId,
                        username: (profile as any).login,
                        name: profile.name ?? null,
                        email: profile.email ?? null,
                        avatar: (profile as any).avatar_url ?? profile.image ?? null,
                        bio: (profile as any).bio ?? null,
                    },
                });
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.accessToken = token.accessToken as string;
                session.user.githubId = token.githubId as string;
                session.user.login = token.login as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
})
