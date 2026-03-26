"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RepoCard from './RepoCard';
import AiSummary from './AiSummary';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';

export type PostType = 'standard' | 'ship';

export interface PostProps {
  id: string;
  type: PostType;
  author: {
    username: string;
    avatar: string;
    statusEmoji?: string | null;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  reactions?: {emoji: string;count: number;hasReacted: boolean;}[];
  images?: string[];
  hashtags?: string[];
  repoUrl?: string | null;
  score?: number;
  passedBadge?: boolean;
  // repo embed for standard posts, or ship details for ship posts
  repoEmbed?: {
    name: string;
    description: string;
    language: string;
    languageColor: string;
    stars: number;
    forks: number;
    lastPush: string;
  };
  shipDetails?: {
    version: string;
    changelog: string;
  };
}

export default function PostCard({ post }: {post: PostProps;}) {
  const [showComments, setShowComments] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);

  const handleReact = async (emoji: string) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (res.ok) {
        const data = await res.json();
        // optimistically update or just sync with response?
        // for simplicity, i can just refetch or toggle locally
        const existing = localReactions.find((r) => r.emoji === emoji);
        if (data.action === 'added') {
          if (existing) {
            setLocalReactions(localReactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r));
          } else {
            setLocalReactions([...localReactions, { emoji, count: 1, hasReacted: true }]);
          }
        } else {
          setLocalReactions(localReactions.map((r) => r.emoji === emoji ? { ...r, count: r.count - 1, hasReacted: false } : r).filter((r) => r.count > 0));
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  return (
    <div className="flex gap-3 px-4 py-4 border-b border-git-border hover:bg-[#161b22]/50 transition-colors">
      
      {/* left column: avatar & thread line */}
      <div className="flex flex-col items-center">
        <Image
          src={post.author.avatar}
          alt={post.author.username}
          width={40}
          height={40}
          className="rounded-full border border-git-border bg-git-bg shrink-0" />
        
        {showComments && <div className="w-[2px] h-full bg-git-border mt-2 rounded-full"></div>}
      </div>

      {/* right column: content */}
      <div className="flex-1 flex flex-col min-w-0">
          {/* header */}
          <div className="flex items-center gap-2 mb-2 w-full">
            <Link href={`/profile/${post.author.username}`} className="font-semibold text-git-text hover:text-git-accent transition-colors text-[15px]">
              <span className="flex items-center gap-1.5">
                <span>{post.author.username}</span>
                {post.author.statusEmoji && (
                  <span className="text-[14px] leading-none" title="User status">
                    {post.author.statusEmoji}
                  </span>
                )}
              </span>
            </Link>
            {post.passedBadge &&
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-git-green/10 border border-git-green/20 text-git-green text-[10px] font-bold uppercase tracking-wider select-none shrink-0" title="Score passed quality threshold">
                    <svg aria-hidden="true" height="12" viewBox="0 0 16 16" width="12" className="fill-current">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                    </svg>
                    Passed
                </div>
          }
            
            {/* badges */}
            {post.type === 'ship' &&
          <span className="text-[10px] bg-git-green text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Shipped {post.shipDetails?.version}
            </span>
          }
          {post.content.startsWith('Opened PR') &&
          <svg height="14" viewBox="0 0 16 16" width="14" className="fill-[#a371f7] shrink-0" aria-label="Pull Request">
              <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" />
            </svg>
          }
          {post.content.startsWith('Opened issue') &&
          <svg height="14" viewBox="0 0 16 16" width="14" className="fill-[#3fb950] shrink-0" aria-label="Issue">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" />
            </svg>
          }
          {post.content.startsWith('Pushed') &&
          <svg height="14" viewBox="0 0 16 16" width="14" className="fill-git-muted shrink-0" aria-label="Push">
              <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
            </svg>
          }
          <span className="text-xs text-git-muted shrink-0 ml-auto">{post.timestamp}</span>
        </div>

        {/* text content (markdown rendered) */}
        <div className="text-sm text-git-text mb-3 leading-relaxed break-words whitespace-pre-wrap markdown-body" style={{ background: 'transparent', padding: 0 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                // turn mentions into profile links if it's not a real url
                if (href?.startsWith('@')) {
                  return <Link href={`/profile/${href.substring(1)}`} className="text-git-accent hover:underline">{children}</Link>;
                }
                if (href?.startsWith('#')) {
                  return <Link href={`/explore/tags/${href.substring(1)}`} className="text-git-accent hover:underline">{children}</Link>;
                }
                return <a href={href} className="text-git-accent hover:underline" target={href?.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{children}</a>;
              },
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>
            }}>
            
            {/* simple pre-processor for #tags and @mentions to turn them into markdown links if not already */}
            {post.content.replace(/(^|\s)(#[\w-]+)/g, '$1[$2]($2)').replace(/(^|\s)(@[\w-]+)/g, '$1[$2]($2)')}
          </ReactMarkdown>
        </div>

        {/* images */}
        {post.images && post.images.length > 0 &&
        <div className={`mb-3 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.images.map((img, i) =>
          <div key={i} className="relative aspect-video w-full overflow-hidden rounded-lg border border-git-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="Post attachment" className="object-cover w-full h-full" loading="lazy" />
              </div>
          )}
          </div>
        }

        {/* ship changelog (if applicable) */}
        {post.type === 'ship' && post.shipDetails &&
        <div className="mb-3 p-3 rounded-lg border border-git-green/30 bg-git-green/5 text-sm font-mono text-git-muted">
            <div className="text-git-green font-semibold mb-2">Changelog:</div>
            <div className="whitespace-pre-wrap">{post.shipDetails.changelog}</div>
          </div>
        }

        {/* embedded repo card */}
        {post.repoEmbed &&
        <div className="mb-3 max-w-full">
            <RepoCard {...post.repoEmbed} />
            {post.repoEmbed.name &&
          <AiSummary owner={post.author.username} repoName={post.repoEmbed.name} />
          }
          </div>
        }

        {/* action bar */}
        <div className="flex items-center gap-6 mt-1 w-full relative">
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-git-muted hover:text-git-accent transition-colors group ${showComments ? 'text-git-accent' : ''}`}
            title="Comments">
            
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current group-hover:bg-git-accent/10 rounded pb-0.5 px-0.5">
              <path d="M1.75 1.5a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25H1.75ZM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-9.5Z"></path>
            </svg>
            <span className="text-xs">{post.comments > 0 ? post.comments : ''}</span>
          </button>
          
          <ReactionPicker
            postId={post.id}
            onReact={handleReact}
            currentReactions={localReactions} />
          

          <div className="flex-1 flex justify-end gap-5">
            <button
              onClick={(e) => {
                e.preventDefault();
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
                // optional toast here
              }}
              className="flex items-center gap-1.5 text-git-muted hover:text-git-accent transition-colors group"
              title="Share link">
              
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className="fill-current group-hover:bg-git-accent/10 rounded pb-0.5 px-0.5">
                    <path d="M10.75 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V2.56L6.53 6.03a1.75 1.75 0 1 0 2.47 2.47l3.47-3.47v.72a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-1.5l-3.47 3.47a3.25 3.25 0 1 1-4.6-4.6l3.47-3.47v-.72a.75.75 0 0 1 1.5 0v1.5l-3.47 3.47a1.75 1.75 0 1 0 2.47 2.47l3.47-3.47v.72a.75.75 0 0 1 1.5 0v-1.5Z"></path>
                    <path d="M11 2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-1 0V3.707l-3.146 3.147a.5.5 0 0 1-.708-.708L13.293 3H11.5a.5.5 0 0 1-.5-.5Z"></path>
                </svg>
            </button>
            <button
              className="flex items-center gap-1.5 text-git-muted hover:text-git-accent transition-colors group"
              title="Bookmark">
              
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className="fill-current group-hover:bg-git-accent/10 rounded pb-0.5 px-0.5">
                    <path d="M3 2.75C3 1.784 3.784 1 4.75 1h6.5c.966 0 1.75.784 1.75 1.75v11.5a.75.75 0 0 1-1.227.579L8 11.722l-3.773 3.107A.751.751 0 0 1 3 14.25Z"></path>
                </svg>
            </button>
          </div>
        </div>

        {/* expandable comments */}
        {showComments &&
        <CommentSection postId={post.id} />
        }
      </div>
    </div>);

}