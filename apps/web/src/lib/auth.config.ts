import GitHub from "next-auth/providers/github"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
    providers: [
        GitHub({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            authorization: { params: { scope: "read:user user:email public_repo" } },
        }),
    ],
    callbacks: {
        // We'll move the DB dependant parts to the main auth.ts
        async jwt({ token, profile }) {
            if (profile) {
                token.login = (profile as any).login as string;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.accessToken = token.accessToken as string;
                // @ts-ignore
                session.user.githubId = token.githubId as string;
                // @ts-ignore
                session.user.login = token.login as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
} satisfies NextAuthConfig
