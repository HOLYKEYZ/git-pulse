import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
    const session = await auth();
    if (!session?.user?.login) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { username: targetUsername } = await params;

        if (session.user.login === targetUsername) {
            return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { username: session.user.login },
        });

        const targetUser = await prisma.user.findUnique({
            where: { username: targetUsername },
        });

        if (!currentUser || !targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if already following
        const existingFollow = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: targetUser.id,
                },
            },
        });

        if (existingFollow) {
            // Unfollow
            await prisma.follow.delete({
                where: { id: existingFollow.id },
            });
            return NextResponse.json({ success: true, action: "unfollowed" });
        }

        // Follow
        const follow = await prisma.follow.create({
            data: {
                followerId: currentUser.id,
                followingId: targetUser.id,
            },
        });

        return NextResponse.json({ success: true, action: "followed", follow });
    } catch (error) {
        console.error("Error toggling follow:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
