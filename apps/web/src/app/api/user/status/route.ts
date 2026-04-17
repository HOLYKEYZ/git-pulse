import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from '@/lib/logger';

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

try {
  const { emoji, text } = await req.json();

  if (typeof emoji !== 'string' || (emoji && [...emoji].length > 1)) {
    return NextResponse.json({ error: 'Status emoji must be a single character' }, { status: 400 });
  }
  if (typeof text !== 'string' || (text && text.length > 80)) {
    return NextResponse.json({ error: 'Status text cannot exceed 80 characters' }, { status: 400 });
  }
  try {
    const user = await prisma.user.update({
      where: { username: session.user.login },
      data: {
        statusEmoji: emoji || null,
        statusText: text || null
      }
    });

    return NextResponse.json({ success: true, statusEmoji: user.statusEmoji, statusText: user.statusText });
  } catch (error) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    } else if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } else {
      logger.error("[UserStatus] Update Error:", error);
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
  }
}
}
