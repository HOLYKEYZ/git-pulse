import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StatusSchema = z.object({
  emoji: z.string().max(10).optional().nullable(),
  text: z.string().max(80).optional().nullable(),
});

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const result = StatusSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: "Invalid status payload", details: result.error.format() }, { status: 400 });
    }
    const { emoji, text } = result.data;
    const user = await prisma.user.update({
      where: { username: session.user.login },
      data: {
        statusEmoji: emoji || null,
        statusText: text || null
      }
    });

    return NextResponse.json({ success: true, statusEmoji: user.statusEmoji, statusText: user.statusText });
  } catch (error) {
    logger.error("[UserStatus] Update Error:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
