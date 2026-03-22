"use client";

import React from "react";
import Link from "next/link";
import type { MonthlyActivity } from "@/lib/github";

interface ContributionActivityProps {
    activity: MonthlyActivity[];
}

export default function ContributionActivity({ activity }: ContributionActivityProps) {
    if (!activity || activity.length === 0) return null;

    return (
        <div className="w-full rounded-xl border border-git-border bg-git-bg overflow-hidden animate-fade-in">
            <div className="px-4 py-3 border-b border-git-border bg-git-card">
                <h2 className="text-sm font-semibold text-git-text">Contribution activity</h2>
            </div>

            <div className="divide-y divide-git-border">
                {activity.map((month) => (
                    <div key={month.month} className="px-4 py-3">
                        {/* Month header */}
                        <h3 className="text-xs font-semibold text-git-muted mb-3">{month.month}</h3>

                        <div className="space-y-2">
                            {/* Commits */}
                            {month.commits > 0 && Array.isArray(month.commitRepos) && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                                            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>
                                        </svg>
                                    </div>
                                    <div className="flex-1 mb-4">
                                        <p className="text-sm text-git-text border-b border-git-border border-solid pb-1 mb-2">
                                            Created <strong>{month.commits.toLocaleString()}</strong> commits in{" "}
                                            <strong>{month.commitRepos.length}</strong> repositor{month.commitRepos.length !== 1 ? 'ies' : 'y'}
                                        </p>
                                        <ul className="flex flex-col gap-1.5">
                                            {month.commitRepos.slice(0, 5).map((repo) => (
                                                <li key={repo.name} className="flex items-center justify-between text-[13px]">
                                                    <Link href={`https://github.com/${repo.name}`} target="_blank" rel="noopener noreferrer" className="text-git-accent font-semibold hover:underline truncate mr-2">
                                                        {repo.name}
                                                    </Link>
                                                    <span className="text-git-muted shrink-0 text-xs">
                                                        {repo.count} commit{repo.count !== 1 ? "s" : ""}
                                                    </span>
                                                </li>
                                            ))}
                                            {month.commitRepos.length > 5 && (
                                                <li className="text-[13px] text-git-muted italic mt-1">
                                                    And {month.commitRepos.length - 5} more...
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* PRs */}
                            {month.prsOpened.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#a371f7]">
                                            <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
                                        </svg>
                                    </div>
                                    <div className="text-sm text-git-text">
                                        <p>Opened <strong>{month.prsOpened.length}</strong> pull request{month.prsOpened.length !== 1 ? "s" : ""}</p>
                                        <div className="mt-1 space-y-1">
                                            {month.prsOpened.map((pr, idx) => (
                                                <div key={idx} className="flex flex-col mb-1 text-xs">
                                                    <Link href={pr.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-git-accent hover:underline">
                                                        {pr.title}
                                                    </Link>
                                                    <span className="text-git-muted truncate">{pr.repo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Issues */}
                            {month.issuesOpened.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#3fb950]">
                                            <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
                                        </svg>
                                    </div>
                                    <div className="text-sm text-git-text">
                                        <p>Opened <strong>{month.issuesOpened.length}</strong> issue{month.issuesOpened.length !== 1 ? "s" : ""}</p>
                                        <div className="mt-1 space-y-1">
                                            {month.issuesOpened.map((issue, idx) => (
                                                <div key={idx} className="flex flex-col mb-1 text-xs">
                                                    <Link href={issue.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-git-accent hover:underline">
                                                        {issue.title}
                                                    </Link>
                                                    <span className="text-git-muted truncate">{issue.repo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Issue Comments */}
                            {month.issueComments.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                                            <path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 13H8.061l-2.574 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-8.5C0 1.784.784 1 1.75 1ZM1.5 2.75v8.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Z"/>
                                        </svg>
                                    </div>
                                    <div className="text-sm text-git-text">
                                        <p>Commented on <strong>{month.issueComments.length}</strong> issue{month.issueComments.length !== 1 ? "s" : ""}</p>
                                        <div className="mt-1 space-y-1">
                                            {month.issueComments.map((comment, idx) => (
                                                <div key={idx} className="flex flex-col mb-1 text-xs">
                                                    <Link href={comment.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-git-accent hover:underline">
                                                        {comment.title}
                                                    </Link>
                                                    <span className="text-git-muted truncate">{comment.repo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* PR Reviews */}
                            {month.prReviews.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#8957e5]">
                                            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.03-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06L6.25 8.94l3.97-3.97a.75.75 0 0 1 1.06 1.06Z"/>
                                        </svg>
                                    </div>
                                    <div className="text-sm text-git-text">
                                        <p>Reviewed <strong>{month.prReviews.length}</strong> pull request{month.prReviews.length !== 1 ? "s" : ""}</p>
                                        <div className="mt-1 space-y-1">
                                            {month.prReviews.map((review, idx) => (
                                                <div key={idx} className="flex flex-col mb-1 text-xs">
                                                    <Link href={review.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-git-accent hover:underline">
                                                        {review.title}
                                                    </Link>
                                                    <span className="text-git-muted truncate">{review.repo}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Repos created */}
                            {month.reposCreated.length > 0 && (
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 shrink-0">
                                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted">
                                            <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/>
                                        </svg>
                                    </div>
                                    <div className="text-sm text-git-text">
                                        <p>Created <strong>{month.reposCreated.length}</strong> repositor{month.reposCreated.length !== 1 ? "ies" : "y"}</p>
                                        <div className="mt-1 space-y-1">
                                            {month.reposCreated.map((repo) => (
                                                <Link
                                                    key={repo}
                                                    href={`https://github.com/${repo}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="block text-xs text-git-accent hover:underline"
                                                >
                                                    {repo}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
