import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    let database = "unknown";

    try {
        await prisma.$queryRaw`SELECT 1`;
        database = "ok";
    } catch {
        database = "error";
    }

    return NextResponse.json(
        {
            commit: process.env.COMMIT_REF ?? process.env.HEAD ?? "unknown",
            deployId: process.env.DEPLOY_ID ?? "unknown",
            context: process.env.CONTEXT ?? "unknown",
            nodeEnv: process.env.NODE_ENV ?? "unknown",
            database,
            auth: {
                hasAuthSecret: Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET),
                hasGithubId: Boolean(process.env.GITHUB_ID ?? process.env.GITHUB_CLIENT_ID ?? process.env.AUTH_GITHUB_ID),
                hasGithubSecret: Boolean(process.env.GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? process.env.AUTH_GITHUB_SECRET),
                hasAuthUrl: Boolean(process.env.AUTH_URL ?? process.env.NEXTAUTH_URL),
            },
            timestamp: new Date().toISOString(),
        },
        {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        },
    );
}
