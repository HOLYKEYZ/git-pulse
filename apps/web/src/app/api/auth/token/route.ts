import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/security";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * get: check if user has an existing api key
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.login) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: { username: session.user.login },
      select: { apiKey: true }
    });
    if (!user) {
      throw new Error('User not found');
    }
    return NextResponse.json({
      hasKey: !!user?.apiKey
    });
  } catch (error) {
    console.error('Error in GET handler:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.login) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rawKey = `gp_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = await hashApiKey(rawKey);
    await prisma.user.update({
      where: { username: session.user.login },
      data: { apiKey: hashedKey }
    });
    return NextResponse.json({
      key: rawKey,
      message: "Save this key — it won't be shown again in full."
    });
  } catch (error) {
    console.error('Error in POST handler:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.login) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await prisma.user.update({
      where: { username: session.user.login },
      data: { apiKey: null }
    });
    return NextResponse.json({ success: true, message: "API key revoked." });
  } catch (error) {
    console.error('Error in DELETE handler:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}
}
