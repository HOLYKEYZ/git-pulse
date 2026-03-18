"use client";

import React, { useState } from 'react';
import SearchBar from '@/components/SearchBar';
import ComposeFeed from '@/components/ComposeFeed';
import ShipItForm from '@/components/ShipItForm';
import PostCard, { PostProps } from '@/components/PostCard';

interface FeedClientProps {
    discoverPosts: PostProps[];
    followingPosts: PostProps[];
    userName: string;
    userAvatar: string;
}

export default function FeedClient({ discoverPosts, followingPosts, userName, userAvatar }: FeedClientProps) {
    const [activeTab, setActiveTab] = useState<'following' | 'discover'>('discover');
    const [composeMode, setComposeMode] = useState<'standard' | 'ship'>('standard');

    const currentPosts = activeTab === 'discover' ? discoverPosts : followingPosts;

    return (
        <div className="flex flex-col min-h-screen pb-20">
            {/* Search Bar */}
            <div className="px-4 pt-4 pb-2">
                <SearchBar />
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-10 bg-git-bg/95 backdrop-blur border-b border-git-border px-4 flex gap-6 font-semibold text-sm">
                <button
                    onClick={() => setActiveTab('following')}
                    className={`py-3 border-b-2 transition-colors ${activeTab === 'following' ? 'border-[#f78166] text-git-text' : 'border-transparent text-git-muted hover:text-git-text'}`}
                >
                    Following
                </button>
                <button
                    onClick={() => setActiveTab('discover')}
                    className={`py-3 border-b-2 transition-colors ${activeTab === 'discover' ? 'border-[#f78166] text-git-text' : 'border-transparent text-git-muted hover:text-git-text'}`}
                >
                    Discover
                </button>
            </div>

            {/* Compose Area */}
            <div className="p-4 border-b border-git-border">
                <div className="flex gap-2 mb-3">
                    <button
                        onClick={() => setComposeMode('standard')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${composeMode === 'standard' ? 'bg-git-card text-git-text border border-git-border' : 'text-git-muted hover:text-git-text hover:bg-git-card/50 border border-transparent'}`}
                    >
                        Post Update
                    </button>
                    <button
                        onClick={() => setComposeMode('ship')}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${composeMode === 'ship' ? 'bg-[#238636]/10 text-git-green border border-[#238636]/30' : 'text-git-muted hover:text-git-green hover:bg-[#238636]/5 border border-transparent'}`}
                    >
                        🚢 Ship a Release
                    </button>
                </div>

                {composeMode === 'standard' ? <ComposeFeed /> : <ShipItForm />}
            </div>

            {/* Feed List */}
            <div className="flex flex-col stagger-children">
                {currentPosts.length === 0 && (
                    <div className="p-8 text-center text-git-muted text-sm border-b border-git-border animate-fade-in">
                        {activeTab === 'following'
                            ? "No posts from people you follow yet. Switch to Discover to see activity."
                            : "No events to show. Try following some users on GitHub!"}
                    </div>
                )}

                {currentPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}
            </div>
        </div>
    );
}
