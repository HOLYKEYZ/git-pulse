import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import rateLimit from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const commentLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id: postId } = params;
        const body = await req.json();
        const { content, parentId } = body;

        if (!content || content.length > 1000) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.login },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
        }

        if (parentId !== undefined && parentId !== null) {
            const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
            if (!parentComment) {
                return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
            }
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                postId,
                authorId: user.id,
                parentId: parentId || null,
            },
            include: {
                author: true,
            },
        });

        return NextResponse.json({ success: true, comment });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
