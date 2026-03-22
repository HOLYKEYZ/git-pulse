import React from "react";
import type { PinnedRepo } from "@/lib/github";
import { getLanguageColor } from "@/lib/colors";

interface PinnedReposProps {
    repos: PinnedRepo[];
}

export default function PinnedRepos({ repos }: PinnedReposProps) {
    if (repos.length === 0) return null;

    return (
        <div className="animate-fade-in">
            <h2 className="text-sm font-semibold text-git-text mb-3 flex items-center gap-2">
                <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                    <path d="m11.294.984 3.722 3.722a1.75 1.75 0 0 1-.504 2.826l-1.327.613a3.089 3.089 0 0 1-.472 1.7l-.2.293-.092.138-.081.065a3.091 3.091 0 0 1-1.898.74H8.36L5.222 14.22a.749.749 0 0 1-1.275-.326.75.75 0 0 1 .144-.584L7.229 9.97H5.044a3.09 3.09 0 0 1-1.839-.732A3.088 3.088 0 0 1 2.106 7.34l.2-.293.092-.138.081-.065c.463-.37 1.016-.6 1.593-.684l3.254-3.254-.463-.463a.75.75 0 0 1 0-1.06l.463-.464A4.819 4.819 0 0 1 10.754.984ZM9.694 2.044a3.318 3.318 0 0 0-2.18.943l-3.71 3.71a1.589 1.589 0 0 0 1.241.803h4.2a1.589 1.589 0 0 0 1.128-.469l.194-.193a1.59 1.59 0 0 0 .348-1.073l.609-.282a.25.25 0 0 0 .072-.404l-3.722-3.722a.25.25 0 0 0-.403.072l-.282.608a1.59 1.59 0 0 0-1.073.348l-.193.194a1.589 1.589 0 0 0-.469 1.128v4.2c.017.456.33.846.803 1.241l3.71-3.71a3.318 3.318 0 0 0 .943-2.18Z"/>
                </svg>
                Pinned
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
                {repos.map((repo) => (
                    <a
                        key={repo.name}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-col rounded-lg border border-git-border bg-git-card p-4 hover:border-git-muted transition-all group"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted shrink-0">
                                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
                            </svg>
                            <span className="text-sm font-semibold text-[#2f81f7] group-hover:underline truncate">
                                {repo.name}
                            </span>
                        </div>

                        {repo.description && (
                            <p className="text-xs text-git-muted mb-3 line-clamp-2 flex-1">
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
                                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current w-3 h-3">
                                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                                    </svg>
                                    <span>{repo.stargazerCount.toLocaleString()}</span>
                                </div>
                            )}
                            {repo.forkCount > 0 && (
                                <div className="flex items-center gap-1">
                                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current w-3 h-3">
                                        <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878A2.25 2.25 0 1 1 12.5 8v1.25a2.25 2.25 0 0 1-2.25 2.25h-1.5v1.128a2.251 2.251 0 1 1-1.5 0V10.25H5.75A2.25 2.25 0 0 1 3.5 8V5.372a2.25 2.25 0 1 1 1.5 0ZM11 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-8 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm5.5 12a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/>
                                    </svg>
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
