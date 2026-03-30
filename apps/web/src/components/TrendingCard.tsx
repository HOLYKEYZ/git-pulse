"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface TrendingRepo {
  id: string;
  html_url: string;
  full_name: string;
  description?: string;
  language?: string;
  stargazers_count: number;
}

interface TrendingDev {
  id: string;
  username: string;
  avatar: string;
  name: string;
  popular_repo?: string | null;
  popular_repo_description?: string | null;
  html_url: string;
}

interface TrendingCardProps {
  repos: TrendingRepo[];
  devs: TrendingDev[];
  isExplorePage?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", Ruby: "#701516",
  PHP: "#4F5D95", Swift: "#F05138", Kotlin: "#A97BFF",
};

export default function TrendingCard({ repos, devs, isExplorePage }: TrendingCardProps) {
  const getLanguageColor = (lang?: string | null) => {
    if (!lang) return "#8b949e";
    return LANGUAGE_COLORS[lang] || "#8b949e";
  };
  const [view, setView] = useState<"repos" | "devs">("repos");

  return (
    <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
      {/* header with toggle */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="font-bold text-xl text-git-text">Trending</h3>
        <div className="flex items-center bg-git-bg rounded-full p-0.5 border border-git-border">
          <button
            onClick={() => setView("repos")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
              view === "repos"
                ? "bg-git-card text-git-text shadow-sm"
                : "text-git-muted hover:text-git-text"
            }`}>
            Repos
          </button>
          <button
            onClick={() => setView("devs")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
              view === "devs"
                ? "bg-git-card text-git-text shadow-sm"
                : "text-git-muted hover:text-git-text"
            }`}>
            Developers
          </button>
        </div>
      </div>

      {/* repos view */}
      {view === "repos" && (
        <div className="stagger-children">
          {repos.length > 0 ? repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <div className="text-[15px] font-bold text-git-text mb-0.5 truncate">
                {repo.full_name}
              </div>
              {repo.description && (
                <p className="text-[13px] text-git-muted line-clamp-2 mb-1.5 leading-snug">{repo.description}</p>
              )}
              <div className="flex items-center gap-3 text-[13px] text-git-muted">
                {repo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: getLanguageColor(repo.language) }} />
                    {repo.language}
                  </span>
                )}
                <span>⭐ {repo.stargazers_count.toLocaleString()}</span>
              </div>
            </a>
          )) : (
            <div className="px-4 py-6 text-[13px] text-git-muted">Loading trending repos...</div>
          )}
        </div>
      )}

      {/* devs view */}
      {view === "devs" && (
        <div className="stagger-children">
          {devs.length > 0 ? devs.map((dev) => (
            <Link
              key={dev.id}
              href={`/profile/${dev.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors">
              <Image
                src={dev.avatar}
                alt={dev.username}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[15px] font-bold text-git-text truncate">
                  {dev.name}
                </span>
                <span className="text-[13px] text-git-muted truncate">@{dev.username}</span>
                {dev.popular_repo && (
                  <span className="text-[11px] text-git-accent truncate mt-0.5">
                    🔥 {dev.popular_repo}
                  </span>
                )}
              </div>
            </Link>
          )) : (
            <div className="px-4 py-6 text-[13px] text-git-muted">Loading trending developers...</div>
          )}
        </div>
      )}

      {/* footer view all */ }
      {!isExplorePage && (
        <div className="px-4 py-3 border-t border-git-border">
          <a href="/explore" className="text-[13px] text-git-accent hover:underline block truncate">
            View all trending
          </a>
        </div>
      )}
    </div>
  );
}
