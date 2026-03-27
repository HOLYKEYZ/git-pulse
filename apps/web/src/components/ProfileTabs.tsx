"use client";

import React from "react";
import Link from "next/link";
import { BookIcon, RepoIcon, StarIcon } from "@primer/octicons-react";

interface ProfileTabsProps {
    username: string;
    activeTab: "overview" | "repositories" | "stars";
    repoCount: number;
    starCount?: number;
}

const TABS = [
    { key: "overview", label: "Overview", Icon: BookIcon },
    { key: "repositories", label: "Repositories", Icon: RepoIcon },
    { key: "stars", label: "Stars", Icon: StarIcon },
] as const;

export default function ProfileTabs({ username, activeTab, repoCount, starCount }: ProfileTabsProps) {
    return (
        <nav className="mb-6 border-b border-git-border/50">
            <div className="flex gap-4 overflow-x-auto">
                {TABS.map((tab) => {
                    const isActive = tab.key === activeTab;
                    const href = tab.key === "overview"
                        ? `/profile/${username}`
                        : `/profile/${username}/${tab.key === "repositories" ? "repos" : tab.key}`;

                    // Extract icon component
                    const IconComponent = tab.Icon;

                    return (
                        <Link
                            key={tab.key}
                            href={href}
className={`flex items-center gap-2 pb-3 pt-2 text-sm font-medium border-b-[3px] transition-colors whitespace-nowrap outline-none ${
        isActive
          ? "border-git-tab-active-border text-git-text"
          : "border-transparent text-git-muted hover:text-git-text hover:border-git-border/50"
      }`}
                        >
                            <IconComponent size={16} className="fill-current" />
                            {tab.label}
                            {tab.key === "repositories" && (
<span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-git-tab-count-bg rounded-full text-git-muted">
                                    {repoCount}
                                </span>
                            )}
                            {tab.key === "stars" && starCount !== undefined && (
                                <span className="ml-1 px-1.5 py-0.5 text-xs font-medium bg-[#30363d] rounded-full text-git-muted">
                                    {starCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
