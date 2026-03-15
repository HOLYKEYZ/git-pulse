import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, type, shipDetails } = body;

        if (!content) {
            return NextResponse.json({ error: "Content is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { username: session.user.login },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
        }

        const post = await prisma.post.create({
            data: {
                content,
                type: type || "standard",
                authorId: user.id,
                shipDetails: shipDetails || null,
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
