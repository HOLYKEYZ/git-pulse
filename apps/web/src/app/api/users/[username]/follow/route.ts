import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: {params: {username: string;}}) {
  const session = await auth();
  if (!session?.user?.login || !session.user.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
const { username: targetUsername } = params;

    if (session.user.login === targetUsername) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { username: session.user.login }
    });

    const targetUser = await prisma.user.findUnique({
      where: { username: targetUsername }
    });

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id
        }
      }
    });

    if (existingFollow) {
      // unfollow — sync to github + local db
      await Promise.all([
      prisma.follow.delete({ where: { id: existingFollow.id } }),
      // sync unfollow to github (best-effort, don't fail if it errors)
      fetch(`https://api.github.com/user/following/${targetUsername}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.user.accessToken}`,
          Accept: "application/vnd.github.v3+json"
        }
      }).catch((err) => console.error(`GitHub unfollow sync failed for ${targetUsername}:`, err))]
      );
      return NextResponse.json({ success: true, action: "unfollowed" });
    }

    // follow — sync to github + local db
    const [follow] = await Promise.all([
    prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUser.id
      }
    }),
    // sync follow to github (best-effort)
    fetch(`https://api.github.com/user/following/${targetUsername}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.user.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Length": "0"
      }
    }).catch((err) => console.error(`GitHub follow sync failed for ${targetUsername}:`, err))]
    );

    // create a follow notification for the target user (fire-and-forget)
    prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "FOLLOW",
        message: `@${session.user.login} started following you`,
        linkUrl: `/profile/${session.user.login}`
      }
    }).catch((err) => console.error("Notification creation failed:", err));

    return NextResponse.json({ success: true, action: "followed", follow });
  } catch (error) {
    console.error("Error toggling follow:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}