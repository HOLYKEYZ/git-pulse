import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emoji, text } = await req.json();

    const user = await prisma.user.update({
      where: { username: session.user.login },
      data: {
        statusEmoji: emoji || null,
        statusText: text || null
      }
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("[UserStatus] Update Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
