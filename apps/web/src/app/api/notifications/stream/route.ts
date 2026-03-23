import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // set up sse headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive"
  });

  const stream = new ReadableStream({
    async start(controller) {
      const sendCount = async () => {
        try {
          const unreadCount = await prisma.notification.count({
            where: { userId, read: false }
          });
          const data = `data: ${JSON.stringify({ unreadCount })}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        } catch (error) {
          console.error("[SSE] Error sending notification count:", error);
          clearInterval(interval);
          try {controller.close();} catch {}
        }
      };

      // send initial count immediately
      await sendCount();

      // poll database every 10 seconds and push updates
      const interval = setInterval(sendCount, 10000);

      // clean up on disconnect
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, { headers });
}