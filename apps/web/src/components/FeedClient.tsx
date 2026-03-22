"use client";

import React, { useState } from 'react';
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

const TABS: { key: TabType; label: string }[] = [
    { key: "discover", label: "Discover" },
    { key: "following", label: "Following" },
    { key: "activity", label: "Activity" },
];

export default function FeedClient({ discoverPosts, followingPosts, activityPosts, userName, userAvatar }: FeedClientProps) {
    const [activeTab, setActiveTab] = useState<TabType>('discover');
    const [composeMode, setComposeMode] = useState<'standard' | 'ship'>('standard');

    const postsMap: Record<TabType, PostProps[]> = {
        discover: discoverPosts,
        following: followingPosts,
        activity: activityPosts,
    };

    const currentPosts = postsMap[activeTab];

    const emptyMessages: Record<TabType, string> = {
        discover: "No posts yet. Be the first to share something!",
        following: "No posts from people you follow yet. Follow some users to see their content here.",
        activity: "No recent GitHub activity from the community. Check back later.",
    };

    return (
        <div className="flex flex-col min-h-screen pb-20">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2">
                <SearchBar />
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-[#2f3336] px-4 flex">
                {TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex-1 py-4 text-[15px] font-bold transition-colors relative hover:bg-white/[0.03] ${
                            activeTab === tab.key
                                ? 'text-git-text'
                                : 'text-git-muted'
                        }`}
                    >
                        {tab.label}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 rounded-full bg-[#1d9bf0]" />
                        )}
                    </button>
                ))}
            </div>

            {/* Compose Area (only on Discover and Following tabs) */}
            {activeTab !== 'activity' && (
                <div className="p-4 border-b border-[#2f3336]">
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setComposeMode('standard')}
                            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors ${composeMode === 'standard' ? 'bg-[#16181c] text-git-text border border-[#2f3336]' : 'text-git-muted hover:text-git-text hover:bg-[#16181c] border border-transparent'}`}
                        >
                            Post Update
                        </button>
                        <button
                            onClick={() => setComposeMode('ship')}
                            className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-colors flex items-center gap-1.5 ${composeMode === 'ship' ? 'bg-[#238636]/10 text-git-green border border-[#238636]/30' : 'text-git-muted hover:text-git-green hover:bg-[#238636]/5 border border-transparent'}`}
                        >
                            🚢 Ship a Release
                        </button>
                    </div>

                    {composeMode === 'standard' ? <ComposeFeed /> : <ShipItForm />}
                </div>
            )}

            {/* Feed List */}
            <div className="flex flex-col stagger-children">
                {currentPosts.length === 0 && (
                    <div className="p-8 text-center text-git-muted text-[15px] border-b border-[#2f3336] animate-fade-in">
                        {emptyMessages[activeTab]}
                    </div>
                )}

                {currentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
