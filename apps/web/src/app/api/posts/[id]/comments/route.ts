import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const resolvedParams = await params;
        const { id: postId } = resolvedParams;
        const body = await req.json();
        const { content, parentId } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.login },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
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
