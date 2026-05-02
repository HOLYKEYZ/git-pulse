import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
  const session = await auth();
  if (!session?.user?.login) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

try {
    const { id: postId } = params;
    // basic cuid validation 
    const cuidRegex = /^c[a-z0-9]{20,32}$/i;
    if (!postId || !cuidRegex.test(postId)) {
      return NextResponse.json({ error: "Invalid post ID format" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: session.user.login }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const originalPost = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!originalPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // prevent double reposting the same post
    const existingRepost = await prisma.post.findFirst({
      where: {
        authorId: user.id,
        repostOfId: originalPost.id
      }
    });

    if (existingRepost) {
      // un-repost
      await prisma.post.delete({
        where: { id: existingRepost.id }
      });
      return NextResponse.json({ success: true, action: "unreposted" });
    }

    // create new repost
    try {
      const repost = await prisma.post.create({
        data: {
          content: `Reposted by @${user.username}`, // arbitrary internal placeholder since UI hides it
          authorId: user.id,
          repostOfId: originalPost.id,
          type: originalPost.type, // inherit type just in case
        }
      });

      // notify the original author
      if (originalPost.authorId !== user.id) {
        await prisma.notification.create({
          data: {
            userId: originalPost.authorId,
            type: "REPOST",
            message: `@${user.username} reposted your post`,
            linkUrl: `/post/${originalPost.id}` // link back to original post
          }
        });
      }

      return NextResponse.json({ success: true, action: "reposted", repost });
    } catch (error) {
      console.error("Error creating repost:", error);
      return NextResponse.json({ error: "Failed to create repost" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error handling repost:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
  }
}
