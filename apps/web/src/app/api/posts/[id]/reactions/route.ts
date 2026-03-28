import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: {params: {id: string;};}) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: postId } = params;
    const body = await req.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.login }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    // check if reaction already exists
    const existingReaction = await prisma.reaction.findUnique({
      where: {
        postId_userId_emoji: {
          postId,
          userId: user.id,
          emoji
        }
      }
    });

    if (existingReaction) {
      // toggle off: delete it
      await prisma.reaction.delete({
        where: { id: existingReaction.id }
      });
      return NextResponse.json({ success: true, action: "removed" });
    }

    // toggle on: create it
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        postId,
userId: user.id
      }
    });

    return NextResponse.json({ success: true, action: "added", reaction });
  } catch (error) {
    console.error("Error toggling reaction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}