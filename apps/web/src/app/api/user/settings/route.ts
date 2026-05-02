import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// get current settings
export async function GET() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

const user = await prisma.user.findUnique({
  where: { username: { equals: session.user.login } },
  select: {
    showActivity: true,
    showContributions: true,
  },
});

  if (!user) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// update settings
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const expectedFields = ['showActivity', 'showContributions'];
  const data: Record<string, boolean> = {};
  for (const field of expectedFields) {
    if (field in body && typeof body[field] === 'boolean') {
      data[field] = body[field];
    } else if (field in body) {
      return NextResponse.json({ error: `Invalid type for ${field}` }, { status: 400 });
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

const updated = await prisma.user.update({
  where: { username: { equals: session.user.login } },
  data,
  select: {
    showActivity: true,
    showContributions: true,
  },
});

  return NextResponse.json(updated);
}

// delete account
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

const userRecord = await prisma.user.findUnique({ where: { id: { equals: session.user.id } }, select: { username: true } });
  if (!userRecord || userRecord.username !== session.user.login) {
    return NextResponse.json({ error: "unauthorized to delete this account" }, { status: 403 });
  }

  try {
    // Explicitly delete associated data before removing the user account
    await prisma.$transaction([
      prisma.post.deleteMany({ where: { author: { username: session.user.login } } }),
      prisma.comment.deleteMany({ where: { author: { username: session.user.login } } }),
      prisma.reaction.deleteMany({ where: { user: { username: session.user.login } } }),
      prisma.follow.deleteMany({ where: { OR: [{ follower: { username: session.user.login } }, { following: { username: session.user.login } }] } }),
      prisma.user.delete({ where: { username: session.user.login } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "failed to delete account" }, { status: 500 });
  }
}
