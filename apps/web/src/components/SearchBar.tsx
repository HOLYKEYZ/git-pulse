"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

interface SearchResult {
    posts: Array<{
        id: string;
        content: string;
        author: { username: string; avatar: string };
        timestamp: string;
    }>;
    users: Array<{
        username: string;
        name: string | null;
        avatar: string | null;
        bio: string | null;
    }>;
}

export default function SearchBar() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Debounced search
    useEffect(() => {
        if (query.length < 2) {
            setResults(null);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                    setIsOpen(true);
                }
            } catch (err) {
                console.error("Search failed:", err);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <svg
                    height="16" viewBox="0 0 16 16" width="16"
                    className="absolute left-3 top-1/2 -translate-y-1/2 fill-git-muted pointer-events-none"
                >
                    <path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"/>
                </svg>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search posts and users..."
                    className="w-full pl-9 pr-4 py-2 bg-git-bg border border-git-border rounded-lg text-sm text-git-text placeholder:text-git-muted focus:outline-none focus:border-git-blue focus:ring-1 focus:ring-git-blue/50 transition-all"
                    onFocus={() => results && setIsOpen(true)}
                />
                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-git-muted border-t-git-blue rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && results && (results.users.length > 0 || results.posts.length > 0) && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-git-card border border-git-border rounded-lg shadow-xl z-50 max-h-[400px] overflow-y-auto animate-fade-in">

                    {/* Users */}
                    {results.users.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-[10px] font-semibold text-git-muted uppercase tracking-wider border-b border-git-border">
                                Users
                            </div>
                            {results.users.map((user) => (
                                <Link
                                    key={user.username}
                                    href={`/profile/${user.username}`}
                                    onClick={() => { setIsOpen(false); setQuery(""); }}
                                    className="flex items-center gap-3 px-3 py-2 hover:bg-git-bg transition-colors"
                                >
                                    <Image
                                        src={user.avatar || "/icon.png"}
                                        alt={user.username}
                                        width={24}
                                        height={24}
                                        className="rounded-full"
                                    />
                                    <div className="min-w-0">
                                        <div className="text-sm font-medium text-git-text truncate">
                                            {user.name || user.username}
                                        </div>
                                        <div className="text-[10px] text-git-muted">@{user.username}</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Posts */}
                    {results.posts.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-[10px] font-semibold text-git-muted uppercase tracking-wider border-b border-git-border">
                                Posts
                            </div>
                            {results.posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="flex items-start gap-3 px-3 py-2 hover:bg-git-bg transition-colors cursor-pointer"
                                    onClick={() => { setIsOpen(false); setQuery(""); }}
                                >
                                    <Image
                                        src={post.author.avatar || "/icon.png"}
                                        alt={post.author.username}
                                        width={20}
                                        height={20}
                                        className="rounded-full mt-0.5"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-medium text-git-text">{post.author.username}</span>
                                        <span className="text-[10px] text-git-muted ml-2">{post.timestamp}</span>
                                        <p className="text-xs text-git-muted line-clamp-2 mt-0.5">{post.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
