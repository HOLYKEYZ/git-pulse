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
    where: { username: session.user.login },
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
  const { showActivity, showContributions } = body;

  // only update fields that are explicitly provided
  const data: Record<string, boolean> = {};
  if (typeof showActivity === "boolean") data.showActivity = showActivity;
  if (typeof showContributions === "boolean") data.showContributions = showContributions;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "no valid fields to update" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { username: session.user.login },
    data,
    select: {
      showActivity: true,
      showContributions: true,
    },
  });

  return NextResponse.json(updated);
}
