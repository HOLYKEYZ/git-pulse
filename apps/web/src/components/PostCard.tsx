import React from 'react';
import RepoCard from './RepoCard';

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
  return (
    <div className="flex gap-3 px-4 py-4 border-b border-git-border hover:bg-[#161b22]/50 transition-colors">
      
      {/* Left Column: Avatar & Thread Line */}
      <div className="flex flex-col items-center">
        <img 
          src={post.author.avatar} 
          alt={post.author.username}
          className="w-10 h-10 rounded-full border border-git-border bg-git-bg shrink-0"
        />
        {/* Thread line placeholder for future nested comments */}
        <div className="w-[2px] h-full bg-git-border mt-2 rounded-full opacity-0"></div>
      </div>

      {/* Right Column: Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-git-text hover:text-git-blue cursor-pointer truncate">
            {post.author.username}
          </span>
          {post.type === 'ship' && (
            <span className="text-xs bg-git-green text-white px-2 py-0.5 rounded-full font-medium">
              Shipped {post.shipDetails?.version}
            </span>
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
          <div className="mb-3 max-w-xl">
            <RepoCard {...post.repoEmbed} />
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center gap-6 mt-1">
          <button className="flex items-center gap-1.5 text-git-muted hover:text-git-blue transition-colors group">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current group-hover:bg-git-blue/10 rounded pb-0.5 px-0.5">
              <path d="M1.75 1.5a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25H1.75ZM0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-9.5Z"></path>
            </svg>
            <span className="text-xs">{post.comments > 0 ? post.comments : ''}</span>
          </button>
          
          <button className="flex items-center gap-1.5 text-git-muted hover:text-git-green transition-colors group">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current group-hover:bg-git-green/10 rounded pb-0.5 px-0.5">
              <path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path>
            </svg>
            <span className="text-xs">{post.likes > 0 ? post.likes : ''}</span>
          </button>

          <button className="flex items-center gap-1.5 text-git-muted hover:text-git-text transition-colors group">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current group-hover:bg-[#8b949e]/10 rounded pb-0.5 px-0.5">
              <path d="M3.75 2a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 3.75 2Zm7 0a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 10.75 2Zm-5.22 8.78a.75.75 0 0 1 1.06-1.06l1.5 1.5a.75.75 0 0 1 0 1.06l-1.5 1.5a.75.75 0 0 1-1.06-1.06l.97-.97-.97-.97Zm7 0a.75.75 0 0 1 1.06-1.06l1.5 1.5a.75.75 0 0 1 0 1.06l-1.5 1.5a.75.75 0 0 1-1.06-1.06l.97-.97-.97-.97Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
