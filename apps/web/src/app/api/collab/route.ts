import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerSideToken } from "@/lib/serverToken";
import { getUserTechStack, findSimilarDevs } from "@/lib/matching";
import { withCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const serverToken = await getServerSideToken(session.user.login);
    if (!serverToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const cacheKey = `collab:${session.user.login}`;

        const matches = await withCache(
            cacheKey,
            async () => {
                const stack = await getUserTechStack(
                    session.user!.login!,
                    serverToken
                );

                if (stack.length === 0) {
                    return [];
                }

                return findSimilarDevs(session.user!.login!, stack);
            },
            1000 * 60 * 60 // 1 hour cache
        );

        return NextResponse.json({ matches });
    } catch (error) {
        console.error("Error finding collab matches:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
