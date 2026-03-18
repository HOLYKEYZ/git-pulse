"use client";

import React, { useState } from 'react';

interface FollowButtonProps {
    targetUsername: string;
    initialIsFollowing: boolean;
    className?: string;
}

export default function FollowButton({ targetUsername, initialIsFollowing, className = "" }: FollowButtonProps) {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);

    const handleFollow = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/users/${targetUsername}/follow`, {
                method: 'POST',
            });

            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.action === 'followed');
            }
        } catch (error) {
            console.error("Failed to toggle follow", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollow}
            disabled={isLoading}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                isFollowing
                    ? 'bg-git-bg border border-git-border text-git-text hover:border-[#f85149] hover:text-[#f85149]'
                    : 'bg-git-card border border-git-border text-git-text hover:bg-git-border'
            } ${className}`}
        >
            {isLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
    );
}
