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
    const login = session.user.login;
    const loginSchema = z.string().trim().min(1).max(100);
    try {
        const result = loginSchema.parse(login);
    } catch (error) {
        return NextResponse.json({ error: "Invalid login" }, { status: 400 });
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
                try {
                    const stack = await getUserTechStack(
                        session.user!.login!,
                        serverToken
                    );
                    
                    if (stack.length === 0) {
                        return [];
                    }
                    
                    return findSimilarDevs(session.user!.login!, stack);
                } catch (error) {
                    console.error('Error finding similar devs:', error);
                    return [];
                }
            },
            1000 * 60 * 60 // 1 hour cache
        );
        
        return NextResponse.json({ matches });
    } catch (error) {
        console.error("Error finding collab matches:", error);
        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        } else {
            return NextResponse.json(
                { error: "An unknown error occurred" },
                { status: 500 }
            );
        }
    }
}
