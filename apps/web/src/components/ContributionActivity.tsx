"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { MonthlyActivity } from "@/lib/github";

interface ContributionActivityProps {
  activity: MonthlyActivity[];
}

export default function ContributionActivity({ activity }: ContributionActivityProps) {
  if (!activity || activity.length === 0) return null;

  return (
    <div className="w-full animate-fade-in">
            <h2 className="text-base font-normal text-git-text mb-4">Contribution activity</h2>

            <div className="relative">
                {activity.map((month) =>
        <MonthSection key={month.month} month={month} />
        )}
            </div>
        </div>);

}

function MonthSection({ month }: {month: MonthlyActivity;}) {
  // find the max commit count for the progress bar scaling
  const maxCommits = Math.max(...(month.commitRepos?.map((r) => r.count) || [1]), 1);

  const hasContent = month.commits > 0 ||
  month.prsOpened.length > 0 ||
  month.issuesOpened.length > 0 ||
  month.issueComments.length > 0 ||
  month.prReviews.length > 0 ||
  month.reposCreated.length > 0;

  if (!hasContent) return null;

  return (
    <div className="mb-6">
        {/* month header - GitHub style horizontal line */}
        <div className="flex items-center mb-4">
            <span className="text-sm font-bold text-[#2f81f7] bg-[#0d1117] pr-3 z-10 shrink-0">
                {month.month}
            </span>
            <div className="h-[1px] bg-git-border flex-1"></div>
        </div>

        <div className="relative pl-6 space-y-5 pb-2">
            {/* vertical timeline line */}
            <div className="absolute top-[6px] bottom-[-24px] left-[7px] w-[2px] bg-[#30363d] z-0"></div>
                    {/* commits section */}
                    {month.commits > 0 && Array.isArray(month.commitRepos) &&
        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex items-center justify-center bg-git-bg rounded-full ring-2 ring-git-bg -ml-[33px] mr-[3px] w-8 h-8 z-10">
                                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted shrink-0">
                                        <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" />
                                    </svg>
                                </span>
                                <span className="text-sm font-semibold text-git-text">
                                    Created <strong className="font-semibold">{month.commits.toLocaleString()}</strong> commit{month.commits !== 1 ? "s" : ""} in{" "}
                                    <strong className="font-semibold">{month.commitRepos.length}</strong> repositor{month.commitRepos.length !== 1 ? "ies" : "y"}
                                </span>
                            </div>
                            {/* repo breakdown with progress bars */}
                            <div className="ml-6 space-y-1.5">
                                {month.commitRepos.slice(0, 5).map((repo) =>
            <div key={repo.name} className="flex items-center gap-3 text-[13px]">
                                        <Link
                href={`https://github.com/${repo.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-git-accent hover:underline truncate shrink-0 max-w-[200px]">
                
                                            {repo.name}
                                        </Link>
                                        <div className="flex-1 h-[8px] bg-[#161b22] rounded-full overflow-hidden">
                                            <div
                  className="h-full bg-[#3fb950] rounded-full"
                  style={{ width: `${Math.max(repo.count / maxCommits * 100, 4)}%` }} />
                
                                        </div>
                                        <span className="text-git-muted shrink-0 text-xs tabular-nums">
                                            {repo.count}
                                        </span>
                                    </div>
            )}
                                {month.commitRepos.length > 5 &&
            <p className="text-xs text-git-muted">
                                        and {month.commitRepos.length - 5} more...
                                    </p>
            }
                            </div>
                        </div>
        }

                    {/* pull requests */}
                    {month.prsOpened.length > 0 &&
        <ActivityRow
          color="#a371f7"
          icon={<svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#a371f7] shrink-0"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z" /></svg>}
          label={<>Opened <strong>{month.prsOpened.length}</strong> pull request{month.prsOpened.length !== 1 ? "s" : ""}</>}
          items={month.prsOpened} />

        }

                    {/* issues */}
                    {month.issuesOpened.length > 0 &&
        <ActivityRow
          color="#3fb950"
          icon={<svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#3fb950] shrink-0"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" /><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z" /></svg>}
          label={<>Opened <strong>{month.issuesOpened.length}</strong> issue{month.issuesOpened.length !== 1 ? "s" : ""}</>}
          items={month.issuesOpened} />

        }

                    {/* comments */}
                    {month.issueComments.length > 0 &&
        <ActivityRow
          color="#8b949e"
          icon={<svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted shrink-0"><path d="M1.75 1h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 13H8.061l-2.574 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-8.5C0 1.784.784 1 1.75 1ZM1.5 2.75v8.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25Z" /></svg>}
          label={<>Commented on <strong>{month.issueComments.length}</strong> issue{month.issueComments.length !== 1 ? "s" : ""}</>}
          items={month.issueComments} />

        }

                    {/* reviews */}
                    {month.prReviews.length > 0 &&
        <ActivityRow
          color="#8957e5"
          icon={<svg height="16" viewBox="0 0 16 16" width="16" className="fill-[#8957e5] shrink-0"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm9.78-2.03-4.5 4.5a.75.75 0 0 1-1.06 0l-2-2a.75.75 0 0 1 1.06-1.06L6.25 8.94l3.97-3.97a.75.75 0 0 1 1.06 1.06Z" /></svg>}
          label={<>Reviewed <strong>{month.prReviews.length}</strong> pull request{month.prReviews.length !== 1 ? "s" : ""}</>}
          items={month.prReviews} />

        }

                    {/* repos created */}
                    {month.reposCreated.length > 0 &&
        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="relative flex items-center justify-center bg-git-bg rounded-full ring-2 ring-git-bg -ml-[33px] mr-[3px] w-8 h-8 z-10">
                                    <svg height="16" viewBox="0 0 16 16" width="16" className="fill-git-muted shrink-0">
                                        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
                                    </svg>
                                </span>
                                <span className="text-sm font-semibold text-git-text">
                                    Created <strong>{month.reposCreated.length}</strong> repositor{month.reposCreated.length !== 1 ? "ies" : "y"}
                                </span>
                            </div>
                            <div className="ml-6 space-y-0.5">
                                {month.reposCreated.map((repo) =>
            <Link
              key={repo}
              href={`https://github.com/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-git-accent hover:underline">
              
                                        {repo}
                                    </Link>
            )}
                            </div>
                        </div>
        }
                </div>
        </div>
  );

}

// reusable row for prs, issues, comments, reviews
function ActivityRow({ color, icon, label, items }: { color: string; icon: React.ReactNode; label: React.ReactNode; items: { title: string; url: string; repo: string; }[]; }) {
  return (
    <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
            <span className="relative flex items-center justify-center bg-git-bg rounded-full ring-2 ring-git-bg -ml-[33px] mr-[3px] w-8 h-8 z-10">
                {icon}
            </span>
            <span className="text-sm font-semibold text-git-text">{label}</span>
        </div>
        <div className="ml-6 space-y-1">
            {items.slice(0, 4).map((item, idx) =>
                <div key={idx} className="flex flex-col text-xs mb-2">
                    <Link
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[14px] font-medium text-git-text hover:text-[#2f81f7] transition-colors truncate">
                        {item.title}
                    </Link>
                    <span className="text-git-muted opacity-80">{item.repo}</span>
                </div>
            )}
            {items.length > 4 &&
                <p className="text-xs font-semibold text-git-muted mt-1 hover:text-git-accent cursor-pointer transition-colors block">
                    and {items.length - 4} more...
                </p>
            }
        </div>
    </div>
  );
}