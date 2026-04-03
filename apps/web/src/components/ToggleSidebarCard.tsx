"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ToggleSidebarCardProps {
  title: string;
  tab1: string;
  tab2: string;
  items1: any[];
  items2: any[];
  type1: "repo" | "dev";
  type2: "repo" | "dev";
  emptyMessage1?: string;
  emptyMessage2?: string;
  hideCommitCount?: boolean;
}

import { LANGUAGE_COLORS, DEFAULT_LANGUAGE_COLOR } from '../lib/colors';

export default function ToggleSidebarCard({
  title,
  tab1,
  tab2,
  items1,
  items2,
  type1,
  type2,
  emptyMessage1 = "No items found.",
  emptyMessage2 = "No items found.",
  hideCommitCount = false
}: ToggleSidebarCardProps) {
  const [view, setView] = useState<"tab1" | "tab2">("tab1");

  const getLanguageColor = (lang?: string | null) => {
    if (!lang) return "#8b949e";
    return LANGUAGE_COLORS[lang] || "#8b949e";
  };

  const currentItems = view === "tab1" ? items1 : items2;
  const currentType = view === "tab1" ? type1 : type2;
  const currentEmpty = view === "tab1" ? emptyMessage1 : emptyMessage2;

  const renderRepo = (repo: any) => (
    <a
      key={repo.id || repo.full_name}
      href={repo.html_url}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-4 py-3 hover:bg-white/[0.03] transition-colors"
    >
      <div className="text-[15px] font-bold text-git-accent mb-0.5 truncate">
        {repo.full_name}
      </div>
      {repo.description && (
        <p className="text-[13px] text-git-muted line-clamp-2 mb-1.5 leading-snug">
          {repo.description}
        </p>
      )}
      <div className="grid grid-cols-[90px_1fr] items-center gap-3 text-[13px] text-git-muted mt-1.5">
        {repo.language ? (
          <span className="flex items-center gap-1.5 truncate">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || DEFAULT_LANGUAGE_COLOR }}
            />
            <span className="truncate">{repo.language}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 truncate">
<span className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-git-muted" />
            <span className="truncate">Unknown</span>
          </span>
        )}
        
        <div className="flex items-center justify-end text-right whitespace-nowrap">
          {!hideCommitCount && (
            repo.commitsToday !== undefined ? (
              <span>⏱️ {repo.commitsToday} commits today</span>
            ) : repo.commitVelocity !== undefined ? (
              <span>📈 {repo.commitVelocity}+ commits building</span>
            ) : (
              <span>⭐ {repo.stargazers_count?.toLocaleString() || 0}</span>
            )
          )}
        </div>
      </div>
    </a>
  );

  const renderDev = (dev: any) => (
    <div
      key={dev.username || dev.login}
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors group"
    >
      <Link href={`/profile/${dev.username || dev.login}`} className="flex items-center gap-3 min-w-0 flex-1">
        <Image
          src={dev.avatar || dev.avatar_url || "/icon.png"}
          alt={dev.username || dev.login}
          width={40}
          height={40}
          className="rounded-full flex-shrink-0"
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[15px] font-bold text-git-text group-hover:underline truncate">
            {dev.name || dev.username || dev.login}
          </span>
          <span className="text-[13px] text-git-muted truncate">
            @{dev.username || dev.login}
          </span>
          {!hideCommitCount && dev.totalContributions !== undefined && (() => {
            const unit = dev.totalContributions === 1 ? 'commit' : (dev.label || 'commits');
            return (
              <span className="flex items-center gap-2 text-[11px] mt-0.5">
                <span className="text-git-green font-semibold">
                  🔥 {dev.totalContributions.toLocaleString()} {unit}
                </span>
                {dev.repoName && (
                  <span className="text-git-accent flex items-center gap-1 ml-auto">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: LANGUAGE_COLORS[dev.repoName] || DEFAULT_LANGUAGE_COLOR}}></span>
                    {dev.repoName} match
                  </span>
                )}
              </span>
            );
          })()}
          {dev.repoDescription && (
            <span className="text-[11px] text-git-muted mt-0.5">
              {dev.repoDescription}
            </span>
          )}
        </div>
      </Link>
      <Link
        href={`/profile/${dev.username || dev.login}`}
        className="ml-auto px-4 py-1.5 rounded-full bg-git-text text-black text-[13px] font-bold hover:bg-[#d7dbdc] transition-colors flex-shrink-0"
      >
        View
      </Link>
    </div>
  );

  return (
    <div className="rounded-2xl border border-git-border bg-git-card overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <h3 className="font-bold text-xl text-git-text">{title}</h3>
        <div className="flex items-center bg-git-bg rounded-full p-0.5 border border-git-border">
          <button
            onClick={() => setView("tab1")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
              view === "tab1"
                ? "bg-git-card text-git-text shadow-sm"
                : "text-git-muted hover:text-git-text"
            }`}
          >
            {tab1}
          </button>
          <button
            onClick={() => setView("tab2")}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all ${
              view === "tab2"
                ? "bg-git-card text-git-text shadow-sm"
                : "text-git-muted hover:text-git-text"
            }`}
          >
            {tab2}
          </button>
        </div>
      </div>

      {/* content view */}
      <div className="stagger-children">
        {currentItems.length > 0 ? (
          currentItems.map((item: any) =>
            currentType === "repo" ? renderRepo(item) : renderDev(item)
          )
        ) : (
          <div className="px-4 py-6 text-[13px] text-git-muted">{currentEmpty}</div>
        )}
      </div>
    </div>
  );
}
