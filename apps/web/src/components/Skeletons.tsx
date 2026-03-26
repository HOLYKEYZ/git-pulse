import React from 'react';

export function PostSkeleton() {
return (
  <div className="flex gap-3 px-4 py-4 border-b border-git-border animate-pulse">
    {/* left column: avatar */}
    <div className="w-10 h-10 rounded-full bg-git-muted/20 shrink-0" />

    {/* right column: content */}
    <div className="flex-1 flex flex-col gap-3 min-w-0">
      <div className="flex items-center gap-2">
        <div className="h-4 w-24 bg-git-muted/20 rounded" />
        <div className="h-3 w-16 bg-git-muted/10 rounded ml-auto" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-git-muted/10 rounded" />
        <div className="h-4 w-[90%] bg-git-muted/10 rounded" />
      </div>
      <div className="flex items-center gap-6 mt-1">
        <div className="h-4 w-12 bg-git-muted/10 rounded" />
        <div className="h-4 w-12 bg-git-muted/10 rounded" />
      </div>
    </div>
  </div>;

}

export function SidebarSkeleton() {
return (
  <div className="rounded-xl border border-git-border bg-git-card p-4 animate-pulse">
    <div className="h-5 w-32 bg-git-muted/20 rounded mb-4" />
    <div className="space-y-4">
      {[1, 2, 3].map((i) =>
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-git-muted/20 shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <div className="h-3 w-20 bg-git-muted/20 rounded" />
            <div className="h-2 w-12 bg-git-muted/10 rounded" />
          </div>
        </div>
      )}
    </div>
  </div>;

}

export function FeedSkeleton() {
  return (
    <div className="flex flex-col">
            {[1, 2, 3, 4, 5].map((i) =>
      <PostSkeleton key={i} />
      )}
        </div>);

}