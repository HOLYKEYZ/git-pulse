"use client";

import React, { useState, useEffect } from 'react';
import SearchBar from '@/components/SearchBar';
import ComposeFeed from '@/components/ComposeFeed';
import ShipItForm from '@/components/ShipItForm';
import PostCard, { PostProps } from '@/components/PostCard';

type TabType = 'discover' | 'following' | 'activity';

interface FeedClientProps {
  discoverPosts: PostProps[];
  followingPosts: PostProps[];
  activityPosts: PostProps[];
  userName: string;
  userAvatar: string;
}

const TABS: {key: TabType;label: string;}[] = [
{ key: "discover", label: "Discover" },
{ key: "following", label: "Following" },
{ key: "activity", label: "Activity" }];


function formatRelativeTimestamp(timestamp: string | Date | number) {
  const d = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(weeks / 4);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export default function FeedClient({ discoverPosts, followingPosts, activityPosts, userName, userAvatar }: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [composeMode, setComposeMode] = useState<'standard' | 'ship'>('standard');
  const [isTabLoading, setIsTabLoading] = useState(false);

  const handleTabChange = (key: TabType) => {
    if (key === activeTab) return;
    setActiveTab(key);
    setIsTabLoading(true);
    setTimeout(() => setIsTabLoading(false), 300);
  };

  // live state
  const [liveDiscover, setLiveDiscover] = useState<PostProps[]>(discoverPosts);

  useEffect(() => {
    const eventSource = new EventSource("/api/feed/stream");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "NEW_POST" && data.post) {
          setLiveDiscover((prev) => {
            // deduplicate protection
            if (prev.find((p) => p.id === data.post.id)) return prev;
const formattedPost = { ...data.post, timestamp: formatRelativeTimestamp(data.post.timestamp) };
            return [formattedPost, ...prev];
          });
        }
      } catch (err) { console.error('Error processing SSE message:', err); }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const postsMap: Record<TabType, PostProps[]> = {
    discover: liveDiscover,
    following: followingPosts,
    activity: activityPosts
  };

  const currentPosts = postsMap[activeTab];

  const emptyMessages: Record<TabType, string> = {
    discover: "No posts yet. Be the first to share something!",
    following: "No posts from people you follow yet. Follow some users to see their content here.",
    activity: "No recent GitHub activity from the community. Check back later."
  };

  return (
    <div className="flex flex-col min-h-screen pb-20">
            {/* search bar */}
            <div className="px-4 pt-4 pb-2">
                <SearchBar />
            </div>

            {/* tabs */}
            <div className="sticky top-0 z-10 bg-git-bg/80 backdrop-blur-md border-b border-git-border px-4 flex">
                {TABS.map((tab) =>
        <button
          key={tab.key}
          onClick={() => handleTabChange(tab.key)}
          className={`flex-1 py-4 text-[15px] font-bold transition-colors relative hover:bg-white/[0.03] ${
          activeTab === tab.key ?
          'text-git-text' :
          'text-git-muted'}`
          }>
          
                        {tab.label}
                        {activeTab === tab.key &&
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-git-accent" />
          }
                    </button>
        )}
            </div>

            {/* compose area (only on discover and following tabs) */}
            {activeTab !== 'activity' &&
      <div className="p-4 border-b border-git-border">
                    <div className="flex gap-2 mb-3">
                        <button
            onClick={() => setComposeMode('standard')}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors ${composeMode === 'standard' ? 'bg-git-card text-git-text border border-git-border' : 'text-git-muted hover:text-git-text hover:bg-git-card border border-transparent'}`}>
            
                            Post Update
                        </button>
                        <button
            onClick={() => setComposeMode('ship')}
            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-1.5 ${composeMode === 'ship' ? 'bg-[#238636]/10 text-git-green border border-[#238636]/30' : 'text-git-muted hover:text-git-green hover:bg-[#238636]/5 border border-transparent'}`}>
            
                            🚢 Ship a Release
                        </button>
                    </div>

                    {composeMode === 'standard' ? <ComposeFeed /> : <ShipItForm />}
                </div>
      }

            {/* feed list */}
            {isTabLoading ? (
              <div className="flex flex-col">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border-b border-git-border animate-pulse flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-git-border shrink-0" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-[#21262d] rounded w-1/4" />
                      <div className="space-y-2">
                        <div className="h-3 bg-[#21262d] rounded w-full" />
                        <div className="h-3 bg-[#21262d] rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="flex flex-col stagger-children">
                    {currentPosts.length === 0 && (
                      <div className="p-12 text-center border-b border-git-border animate-fade-in flex flex-col items-center justify-center min-h-[300px]">
                        <div className="w-16 h-16 rounded-full bg-git-border flex items-center justify-center mb-4">
                          <svg viewBox="0 0 16 16" width="24" height="24" className="fill-git-muted"><path d="M2.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H2.75Zm-.25-1.5h10.5a1.75 1.75 0 0 1 1.75 1.75v10.5a1.75 1.75 0 0 1-1.75 1.75H2.75A1.75 1.75 0 0 1 1 13.25V2.75C1 1.784 1.784 1 2.75 1ZM8 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM4.75 8.5C4.75 7.672 5.422 7 6.25 7h3.5c.828 0 1.5.672 1.5 1.5v2.25c0 .414-.336.75-.75.75H5.5a.75.75 0 0 1-.75-.75V8.5Z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-git-text mb-2">Welcome to your feed!</h3>
                        <p className="text-[15px] text-git-muted max-w-sm mb-6">
                            {emptyMessages[activeTab]}
                        </p>
                        {activeTab === 'following' && (
                          <a href="/explore" className="bg-git-text text-black font-bold px-5 py-2.5 rounded-full hover:bg-[#d7dbdc] transition-colors">
                            Find people to follow
                          </a>
                        )}
                      </div>
                    )}

                    {currentPosts.map((post) =>
                    <PostCard key={post.id} post={post} />
                    )}
                </div>
            )}
        </div>);

}