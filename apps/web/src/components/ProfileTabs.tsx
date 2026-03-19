"use client";

import React from "react";
import Link from "next/link";

interface ProfileTabsProps {
    username: string;
    activeTab: "overview" | "repositories" | "stars";
    repoCount: number;
}

const TABS = [
    { key: "overview", label: "Overview", icon: "M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z" },
    { key: "repositories", label: "Repositories", icon: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" },
    { key: "stars", label: "Stars", icon: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" },
] as const;

export default function ProfileTabs({ username, activeTab, repoCount }: ProfileTabsProps) {
    return (
        <nav className="border-b border-git-border mb-6">
            <div className="flex gap-0 overflow-x-auto">
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const href = tab.key === "overview"
                        ? `/profile/${username}`
                        : `/profile/${username}/${tab.key === "repositories" ? "repos" : tab.key}`;

                    return (
                        <Link
                            key={tab.key}
                            href={href}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                isActive
                                    ? "border-[#f78166] text-git-text"
                                    : "border-transparent text-git-muted hover:text-git-text hover:border-git-border"
                            }`}
                        >
                            <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current">
                                <path d={tab.icon} />
                            </svg>
                            {tab.label}
                            {tab.key === "repositories" && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-[#30363d] rounded-full text-git-muted">
                                    {repoCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
