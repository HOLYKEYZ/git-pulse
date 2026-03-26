import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        user: { username: session.user.login }
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 30 // get the latest 30 notifications
    });

    return NextResponse.json(notifications);
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

    if (notificationId) {
      // mark specific notification as read
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
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
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}