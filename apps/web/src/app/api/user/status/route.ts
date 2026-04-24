import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const StatusSchema = z.object({
  emoji: z.string().max(10).regex(/^[\w\s]+$/).optional().nullable(),
  text: z.string().max(80).regex(/^[\w\s]+$/).optional().nullable(),
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
  if (emoji && !emoji.match(/^[\w\s]+$/)) {
    return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
  }
  if (text && !text.match(/^[\w\s]+$/)) {
    return NextResponse.json({ error: "Invalid text" }, { status: 400 });
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
    console.error("[UserStatus] Update Error:", error);
    return NextResponse.json({ error: "Failed to update status", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
} catch (error) {
  console.error("[UserStatus] Parse Error:", error);
  return NextResponse.json({ error: "Failed to parse request", details: error instanceof Error ? error.message : "Unknown error" }, { status: 400 });
}
}
