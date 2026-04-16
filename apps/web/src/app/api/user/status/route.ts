import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from '@/lib/logger';
import { validateEmoji, validateText } from '@/lib/validation';

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { emoji, text } = await req.json();

    if (!validateEmoji(emoji)) {
      return NextResponse.json({ error: 'Invalid status emoji' }, { status: 400 });
    }
    if (!validateText(text)) {
      return NextResponse.json({ error: 'Invalid status text' }, { status: 400 });
    }
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

// Example validation functions
function validateEmoji(emoji: string | null): boolean {
  if (!emoji) return true; // Allow null or empty string
  if (typeof emoji !== 'string') return false;
  if (emoji.length !== 1 && emoji.length !== 2) return false; // Length check for Unicode characters
  try {
    // Basic validation, consider using a library for more comprehensive checks
    const codePoint = emoji.codePointAt(0);
    if (codePoint === undefined) return false;
    // Additional checks can be added here for specific Unicode ranges
    return true;
  } catch (e) {
    return false;
  }
}

function validateText(text: string | null): boolean {
  if (!text) return true; // Allow null or empty string
  if (typeof text !== 'string') return false;
  if (text.length > 80) return false;
  // Additional checks can be added here for harmful content
  return true;
}
