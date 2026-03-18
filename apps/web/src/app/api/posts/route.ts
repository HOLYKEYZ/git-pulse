import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import rateLimit from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const limiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500,
});

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await limiter.check(10, session.user.login);
    } catch {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
    }

    try {
        const body = await req.json();
        const { content, type, shipDetails, images, repoUrl } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.login },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
        }

        // Extract hashtags from content (e.g., #building-in-public)
        const matchedTags: string[] = content.match(/#[\w-]+/g) || [];
        const hashtags = Array.from(new Set(matchedTags)).map(tag => tag.substring(1));

        const post = await prisma.post.create({
            data: {
                content,
                type: type || "standard",
                authorId: user.id,
                shipDetails: shipDetails || null,
                images: images || [],
                repoUrl: repoUrl || null,
                hashtags,
            },
            include: {
                author: true,
            },
        });

        return NextResponse.json({ success: true, post });
    } catch (error) {
        console.error("Error creating post:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
