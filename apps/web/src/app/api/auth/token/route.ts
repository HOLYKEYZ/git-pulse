import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * get: check if user has an existing api key
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { username: session.user.login },
    select: { apiKey: true }
  });

  return NextResponse.json({
    hasKey: !!user?.apiKey,
    keyPreview: user?.apiKey ? `gp_...${user.apiKey.slice(-4)}` : null
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rawKey = `gp_${crypto.randomBytes(32).toString("hex")}`;

  await prisma.user.update({
    where: { username: session.user.login },
    data: { apiKey: rawKey }
  });

  return NextResponse.json({
    key: rawKey,
    message: "Save this key — it won't be shown again in full."
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { username: session.user.login },
    data: { apiKey: null }
  });

  return NextResponse.json({ success: true, message: "API key revoked." });
}