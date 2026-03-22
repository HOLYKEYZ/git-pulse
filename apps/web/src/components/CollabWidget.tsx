"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface CollabMatch {
    username: string;
    avatar: string;
    sharedLanguages: string[];
    similarity: number;
}

export default function CollabWidget() {
    const [matches, setMatches] = useState<CollabMatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMatches() {
            try {
                const res = await fetch("/api/collab");
                if (res.ok) {
                    const data = await res.json();
                    setMatches(data.matches || []);
                }
            } catch {
                // silently fail
            } finally {
                setLoading(false);
            }
        }
        fetchMatches();
    }, []);

    if (loading) {
        return (
            <div className="border border-git-border rounded-lg p-4 bg-git-card">
                <h3 className="text-sm font-semibold text-git-text mb-3">Developers like you</h3>
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-git-border" />
                            <div className="flex-1 space-y-1">
                                <div className="h-3 w-24 bg-git-border rounded" />
                                <div className="h-2 w-32 bg-git-border rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (matches.length === 0) return null;

    return (
        <div className="border border-git-border rounded-lg p-4 bg-git-card">
            <h3 className="text-sm font-semibold text-git-text mb-3 flex items-center gap-2">
                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-accent">
                    <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z" />
                </svg>
                Developers like you
            </h3>
            <div className="space-y-3">
                {matches.map((match) => (
                    <Link
                        key={match.username}
                        href={`/profile/${match.username}`}
                        className="flex items-center gap-3 hover:bg-[#161b22] rounded-md p-1.5 -mx-1.5 transition-colors group"
                    >
                        <Image
                            src={match.avatar}
                            alt={match.username}
                            width={32}
                            height={32}
                            className="rounded-full border border-git-border"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm text-git-text font-medium group-hover:text-git-accent transition-colors truncate">
                                @{match.username}
                            </span>
                            <span className="text-[11px] text-git-muted truncate">
                                {match.sharedLanguages.join(", ")} · {Math.round(match.similarity * 100)}% match
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
