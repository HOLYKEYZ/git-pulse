"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import RepoCard from './RepoCard';
import ReactionPicker from './ReactionPicker';
import CommentSection from './CommentSection';

export type PostType = 'standard' | 'ship';

export interface PostProps {
  id: string;
  type: PostType;
  author: {
    username: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  reactions?: { emoji: string; count: number; hasReacted: boolean }[];
  // Repo embed for standard posts, or Ship details for ship posts
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

export default function PostCard({ post }: { post: PostProps }) {
  const [showComments, setShowComments] = useState(false);
  const [localReactions, setLocalReactions] = useState(post.reactions || []);

  const handleReact = async (emoji: string) => {
    try {
      const res = await fetch(`/api/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (res.ok) {
        const data = await res.json();
        // Optimistically update or just sync with response?
        // For simplicity, we can just refetch or toggle locally
        const existing = localReactions.find(r => r.emoji === emoji);
        if (data.action === 'added') {
            if (existing) {
                setLocalReactions(localReactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, hasReacted: true } : r));
            } else {
                setLocalReactions([...localReactions, { emoji, count: 1, hasReacted: true }]);
            }
        } else {
            setLocalReactions(localReactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, hasReacted: false } : r).filter(r => r.count > 0));
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  return (
    <div className="flex gap-3 px-4 py-4 border-b border-git-border hover:bg-[#161b22]/50 transition-colors">
      
      {/* Left Column: Avatar & Thread Line */}
      <div className="flex flex-col items-center">
        <Image 
          src={post.author.avatar} 
          alt={post.author.username}
          width={40}
          height={40}
          className="rounded-full border border-git-border bg-git-bg shrink-0"
        />
        {showComments && <div className="w-[2px] h-full bg-git-border mt-2 rounded-full"></div>}
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/profile/${post.author.username}`} className="font-semibold text-git-text hover:text-git-blue transition-colors truncate">
            {post.author.username}
          </Link>
          {post.type === 'ship' && (
            <span className="text-[10px] bg-git-green text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Shipped {post.shipDetails?.version}
            </span>
          )}
          {post.content.startsWith('Opened PR') && (
            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-[#a371f7] shrink-0" aria-label="Pull Request">
              <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
            </svg>
          )}
          {post.content.startsWith('Opened issue') && (
            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-[#3fb950] shrink-0" aria-label="Issue">
              <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
            </svg>
          )}
          {post.content.startsWith('Pushed') && (
            <svg height="14" viewBox="0 0 16 16" width="14" className="fill-git-muted shrink-0" aria-label="Push">
              <path d="M10.5 7.75a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm1.43.75a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
            </svg>
          )}
          <span className="text-xs text-git-muted shrink-0 ml-auto">{post.timestamp}</span>
        </div>

        {/* Text Content */}
        <div className="text-sm text-git-text mb-3 leading-relaxed break-words whitespace-pre-wrap">
          {post.content}
        </div>

        {/* Ship Changelog (if applicable) */}
        {post.type === 'ship' && post.shipDetails && (
          <div className="mb-3 p-3 rounded-lg border border-git-green/30 bg-git-green/5 text-sm font-mono text-git-muted">
            <div className="text-git-green font-semibold mb-2">Changelog:</div>
            <div className="whitespace-pre-wrap">{post.shipDetails.changelog}</div>
          </div>
        )}

        {/* Embedded Repo Card */}
        {post.repoEmbed && (
          <div className="mb-3 max-w-full">
            <RepoCard {...post.repoEmbed} />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-6 mt-1">
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-git-muted hover:text-git-blue transition-colors group ${showComments ? 'text-git-blue' : ''}`}
          >
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current group-hover:bg-git-blue/10 rounded pb-0.5 px-0.5">
              <path d="M1.75 1.5a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25H1.75ZM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-9.5Z"></path>
            </svg>
            <span className="text-xs">{post.comments > 0 ? post.comments : ''}</span>
          </button>
          
          <ReactionPicker 
            postId={post.id} 
            onReact={handleReact} 
            currentReactions={localReactions}
          />
        </div>

        {/* Expandable Comments */}
        {showComments && (
            <CommentSection postId={post.id} />
        )}
      </div>
    </div>
  );
}

