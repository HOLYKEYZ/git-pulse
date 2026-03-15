import NextAuth, { type DefaultSession } from "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            githubId: string
            accessToken: string
            login: string // GitHub username
        } & DefaultSession["user"]
    }

    interface Profile {
        login?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken: string
        githubId: string
        login: string
    }
}
