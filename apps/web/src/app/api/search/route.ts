import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
        return NextResponse.json({ posts: [], users: [] });
    }

    const [posts, users] = await Promise.all([
        prisma.post.findMany({
            where: { content: { contains: q, mode: "insensitive" } },
            include: { author: true, _count: { select: { comments: true, reactions: true } } },
            orderBy: { createdAt: "desc" },
            take: 10,
        }),
        prisma.user.findMany({
            where: {
                OR: [
                    { username: { contains: q, mode: "insensitive" } },
                    { name: { contains: q, mode: "insensitive" } },
                ],
            },
            select: { username: true, name: true, avatar: true, bio: true },
            take: 5,
        }),
    ]);

    return NextResponse.json({
        posts: posts.map((p) => ({
            id: p.id,
            type: p.type,
            content: p.content,
            author: {
                username: p.author.username,
                avatar: p.author.avatar ?? "",
            },
            timestamp: p.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            likes: p._count.reactions,
            comments: p._count.comments,
        })),
        users,
    });
}
