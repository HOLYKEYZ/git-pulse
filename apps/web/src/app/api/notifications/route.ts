import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from 'zod';

export const dynamic = "force-dynamic";

const notificationSchema = z.object({
  id: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await prisma.notification.findMany({
      where: {
        user: { username: session.user.login }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30 // get the latest 30 notifications
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { notificationId } = body;
    const notificationSchema = z.object({
      id: z.string().uuid(),
    });
    const parsedNotificationId = notificationSchema.safeParse({ id: notificationId });
    if (!parsedNotificationId.success) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    if (parsedNotificationId.data.id) {
      // mark specific notification as read
      await prisma.notification.updateMany({
        where: {
          id: parsedNotificationId.data.id,
          user: { username: session.user.login } // ensure they own it
        },
        data: {
          read: true
        }
      });
      return NextResponse.json({ success: true });
    } else {
      // mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          user: { username: session.user.login },
          read: false
        },
        data: {
          read: true
        }
      });
      return NextResponse.json({ success: true, message: "All notifications marked as read." });
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
