import React from "react";
import type { PinnedRepo } from "@/lib/github";
import { getLanguageColor } from "@/lib/colors";
import { PinIcon, RepoIcon, GrabberIcon, StarIcon, RepoForkedIcon } from "@primer/octicons-react";

interface PinnedReposProps {
    repos: PinnedRepo[];
}

export default function PinnedRepos({ repos }: PinnedReposProps) {
    if (repos.length === 0) return null;

    return (
        <div className="animate-fade-in">
            <h2 className="text-sm font-semibold text-git-text mb-3 flex items-center gap-2">
                <PinIcon size={16} className="fill-git-muted" />
                Pinned
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
                {repos.map((repo) => (
                    <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col rounded-lg border border-git-border bg-git-card p-4 hover:border-git-muted transition-all relative"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                <RepoIcon size={16} className="fill-git-muted shrink-0" />
                                <span className="text-sm font-semibold text-git-link-blue hover:underline truncate">
                                    {repo.name}
                                </span>
                                <span className="rounded-full border border-git-border/60 px-2 py-0.5 text-[10px] sm:text-[11px] text-git-muted font-medium bg-transparent leading-none ml-1">
                                    Public
                                </span>
                            </div>
                            {/* Drag handle / context menu placeholder matching github */}
                            <GrabberIcon size={16} aria-label="Drag to reorder repository" className="fill-git-muted shrink-0 cursor-grab hover:fill-git-text transition-colors" />
                        </div>

                        {repo.description && (
                            <p className="text-xs text-git-muted mb-4 flex-1 line-clamp-2 leading-[1.6]">
                                {repo.description}
                            </p>
                        )}

                        <div className="flex items-center gap-4 text-[11px] text-git-muted mt-auto">
                            {repo.primaryLanguage && (
                                <div className="flex items-center gap-1">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: repo.primaryLanguage.color || getLanguageColor(repo.primaryLanguage.name) }}
                                    />
                                    <span>{repo.primaryLanguage.name}</span>
                                </div>
                            )}
                            {repo.stargazerCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <StarIcon size={16} className="fill-current w-3 h-3" />
                                    <span>{repo.stargazerCount.toLocaleString()}</span>
                                </div>
                            )}
                            {repo.forkCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <RepoForkedIcon size={16} className="fill-current w-3 h-3" />
                                    <span>{repo.forkCount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}
