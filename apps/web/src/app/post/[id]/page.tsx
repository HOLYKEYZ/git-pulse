import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import BackButton from "@/components/BackButton";
import { getRelativeTime } from "@/lib/utils";
import CommentSection from "@/components/CommentSection";
import TimeDisplay from "@/components/TimeDisplay";
import RepoCard from "@/components/RepoCard";
import PostContentRenderer from "@/components/PostContentRenderer";
import { notFound } from "next/navigation";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const post = await prisma.post.findUnique({
    where: { id: params.id },
    select: { content: true, author: { select: { username: true } } }
  });
  if (!post) return { title: "Post Not Found | GitPulse" };
  return {
    title: `${post.author.username}'s post | GitPulse`,
    description: post.content.slice(0, 160)
  };
}

export default async function PostPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();

  const post = await prisma.post.findUnique({
    where: { id: params.id },
    include: {
      author: true,
      _count: { select: { comments: true, reactions: true } }
    }
  });

  if (!post) notFound();

  const dbComments = await prisma.comment.findMany({
    where: { postId: post.id, parentId: null },
    include: { author: true },
    orderBy: { createdAt: 'asc' }
  });

  const initialComments = dbComments.map((c: any) => ({
    id: c.id,
    content: c.content,
    author: { username: c.author.username, avatar: c.author.avatar || '/icon.png' },
    timestamp: c.createdAt.toISOString()
  }));

  return (
    <div className="flex flex-col w-full max-w-[600px] mx-auto min-h-screen">
      {/* header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-git-border bg-git-bg/80 backdrop-blur-md">
        <BackButton />
        <h1 className="text-lg font-bold text-git-text">Post</h1>
      </div>

      {/* post content */}
      <div className="px-4 py-5 border-b border-git-border">
        {/* author info */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${post.author.username}`}>
            <Image
              src={post.author.avatar || "/icon.png"}
              alt={post.author.username}
              width={48}
              height={48}
              className="rounded-full border border-git-border"
            />
          </Link>
          <div className="flex flex-col">
            <Link href={`/profile/${post.author.username}`} className="font-bold text-git-text hover:text-git-accent transition-colors text-[15px]">
              {post.author.name || post.author.username}
            </Link>
            <span className="text-[13px] text-git-muted">@{post.author.username}</span>
          </div>
        </div>

        {/* post text — rendered markdown */}
        <PostContentRenderer content={post.content} />

        {/* images */}
        {post.images && post.images.length > 0 && (
          <div className={`mb-4 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.images.map((img: string, i: number) => (
              <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg border border-git-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="Post attachment" className="object-cover w-full h-full" loading="lazy" />
              </div>
            ))}
          </div>
        )}

        {/* repo embed */}
        {post.repoEmbed && (
          <div className="mb-4">
            <RepoCard {...(post.repoEmbed as any)} />
          </div>
        )}

        {/* ship details */}
        {post.type === "ship" && post.shipDetails && (
          <div className="mb-4 p-3 rounded-lg border border-git-green/30 bg-git-green/5 text-sm font-mono text-git-muted">
            <div className="text-git-green font-semibold mb-2">Changelog:</div>
            <div className="whitespace-pre-wrap">{(post.shipDetails as any).changelog}</div>
          </div>
        )}

        {/* metadata */}
        <div className="flex items-center gap-4 text-[13px] text-git-muted pt-3 border-t border-git-border">
          <time><TimeDisplay time={post.createdAt.toISOString()} /></time>
          <span>{post._count.reactions} reactions</span>
          <span>{post._count.comments} comments</span>
        </div>
      </div>

      {/* comment section */}
      <div className="px-4 py-4">
        <CommentSection postId={post.id} initialComments={initialComments} />
      </div>
    </div>
  );
}
