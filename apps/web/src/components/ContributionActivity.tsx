"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RepoPushIcon, GitPullRequestIcon, IssueOpenedIcon, CommentIcon, EyeIcon, RepoIcon } from "@primer/octicons-react";
import type { MonthlyActivity } from "@/lib/github";

interface ContributionActivityProps {
  activity: MonthlyActivity[];
}

export default function ContributionActivity({ activity }: ContributionActivityProps) {
  if (!activity || activity.length === 0) return null;

  return (
    <div className="w-full animate-fade-in relative">
      <h2 className="text-base font-normal text-git-text mb-4">Contribution activity</h2>

      <div className="relative">
        {activity.map((month) => (
          <MonthSection key={month.month} month={month} />
        ))}
      </div>
    </div>
  );
}

function MonthSection({ month }: { month: MonthlyActivity }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // find the max commit count for the progress bar scaling
  const maxCommits = Math.max(...(month.commitRepos?.map((r) => r.count) || [1]), 1);

  const hasContent =
    month.commits > 0 ||
    month.prsOpened.length > 0 ||
    month.issuesOpened.length > 0 ||
    month.issueComments.length > 0 ||
    month.prReviews.length > 0 ||
    month.reposCreated.length > 0;

  if (!hasContent) return null;

  // GitHub colors
  const commitColor = "#30363d"; // actually commits use a standard grey/git border or same color as the line
  const prColor = "#8250df"; // purple
  const issueColor = "#3fb950"; // green
  const generalColor = "#8b949e"; // muted
  const reviewColor = "#8957e5"; // purple

  return (
    <div className="mb-0">
      {/* month header - GitHub style horizontal line */}
      <div className="flex items-center mb-4 mt-8 first:mt-2 relative z-10">
        <span className="text-sm font-semibold text-git-text bg-git-bg pr-3 shrink-0">
          {month.month}
        </span>
        <div className="h-[1px] bg-git-border flex-1"></div>
      </div>

      <div className="relative pl-[32px] space-y-6 pb-2">
        {/* vertical timeline line */}
        <div className="absolute top-2 bottom-[-16px] left-[15px] w-[2px] bg-[#30363d] z-0"></div>

        {/* commits section */}
        {month.commits > 0 && Array.isArray(month.commitRepos) && (
          <div className="relative">
            <div className="flex items-start gap-3 mb-2">
              <span className="relative flex items-center justify-center bg-git-bg rounded-full border-[2px] border-[#30363d] -ml-[33px] mr-[3px] w-8 h-8 z-10 shrink-0 text-git-muted">
                <RepoPushIcon size={16} />
              </span>
              <div className="flex-1 pt-1">
                <span className="text-sm text-git-text">
                  Created {" "}
                  <strong className="font-semibold">{month.commits.toLocaleString()}</strong> commit{month.commits !== 1 ? "s" : ""} in{" "}
                  <strong className="font-semibold">{month.commitRepos.length}</strong> repositor{month.commitRepos.length !== 1 ? "ies" : "y"}
                </span>

                {/* repo breakdown with progress bars */}
                <div className="mt-3 space-y-[6px]">
                  {month.commitRepos.slice(0, isExpanded ? undefined : 4).map((repo) => (
                    <div key={repo.name} className="flex items-center gap-3 text-sm">
                      <Link
                        href={`https://github.com/${repo.name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-git-accent hover:underline truncate shrink-0 max-w-[200px]"
                      >
                        {repo.name}
                      </Link>
                      <div className="flex-1 h-[8px] bg-[#161b22] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1f6feb] rounded-full"
                          style={{ width: `${Math.max((repo.count / maxCommits) * 100, 4)}%` }}
                        />
                      </div>
                      <span className="text-git-muted shrink-0 text-xs tabular-nums">
                        {repo.count} {repo.count === 1 ? 'commit' : 'commits'}
                      </span>
                    </div>
                  ))}
                  {!isExpanded && month.commitRepos.length > 4 && (
                    <button 
                      onClick={() => setIsExpanded(true)}
                      className="text-xs text-git-muted hover:text-git-accent font-medium mt-2 flex items-center gap-1"
                    >
                      <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className="opacity-70"><path d="m8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z"></path></svg>
                      Show {month.commitRepos.length - 4} more repositories
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* pull requests */}
        {month.prsOpened.length > 0 && (
          <ActivityRow
            color={prColor}
            bgColor="bg-[#8250df]/10"
            icon={<GitPullRequestIcon size={16} />}
            label={
              <>
                Opened <strong>{month.prsOpened.length}</strong> pull request{month.prsOpened.length !== 1 ? "s" : ""} in <strong>{Array.from(new Set(month.prsOpened.map(pr => pr.repo))).length}</strong> repositor{Array.from(new Set(month.prsOpened.map(pr => pr.repo))).length !== 1 ? "ies" : "y"}
              </>
            }
            items={month.prsOpened}
          />
        )}

        {/* issues */}
        {month.issuesOpened.length > 0 && (
          <ActivityRow
            color={issueColor}
            bgColor="bg-[#3fb950]/10"
            icon={<IssueOpenedIcon size={16} />}
            label={
              <>
                Opened <strong>{month.issuesOpened.length}</strong> issue{month.issuesOpened.length !== 1 ? "s" : ""} in <strong>{Array.from(new Set(month.issuesOpened.map(i => i.repo))).length}</strong> repositor{Array.from(new Set(month.issuesOpened.map(i => i.repo))).length !== 1 ? "ies" : "y"}
              </>
            }
            items={month.issuesOpened}
          />
        )}

        {/* comments */}
        {month.issueComments.length > 0 && (
          <ActivityRow
            color={generalColor}
            bgColor="bg-[#8b949e]/10"
            icon={<CommentIcon size={16} />}
            label={
              <>
                Commented on <strong>{month.issueComments.length}</strong> issue{month.issueComments.length !== 1 ? "s" : ""} in <strong>{Array.from(new Set(month.issueComments.map(i => i.repo))).length}</strong> repositor{Array.from(new Set(month.issueComments.map(i => i.repo))).length !== 1 ? "ies" : "y"}
              </>
            }
            items={month.issueComments}
          />
        )}

        {/* reviews */}
        {month.prReviews.length > 0 && (
          <ActivityRow
            color={generalColor}
            bgColor="bg-[#8b949e]/10"
            icon={<EyeIcon size={16} />}
            label={
              <>
                Reviewed <strong>{month.prReviews.length}</strong> pull request{month.prReviews.length !== 1 ? "s" : ""} in <strong>{Array.from(new Set(month.prReviews.map(pr => pr.repo))).length}</strong> repositor{Array.from(new Set(month.prReviews.map(pr => pr.repo))).length !== 1 ? "ies" : "y"}
              </>
            }
            items={month.prReviews}
          />
        )}

        {/* repos created */}
        {month.reposCreated.length > 0 && (
          <div className="relative">
            <div className="flex items-start gap-3 mb-4">
              <span 
                className="relative flex items-center justify-center rounded-full w-8 h-8 z-10 shrink-0 text-git-text border border-transparent"
                style={{ backgroundColor: 'transparent' }}
              >
                <div className="w-[32px] h-[32px] rounded-full border border-git-border bg-git-bg object-center flex items-center justify-center absolute -left-[35px] top-0 text-git-text shadow-sm">
                  <RepoIcon size={16} />
                </div>
              </span>
              <div className="flex-1 pt-1 ml-[2px]">
                <span className="text-sm text-git-text">
                  Created <strong>{month.reposCreated.length}</strong> repositor{month.reposCreated.length !== 1 ? "ies" : "y"}
                </span>
                <div className="mt-2 space-y-2">
                  {month.reposCreated.map((repo) => (
                    <Link
                      key={repo}
                      href={`https://github.com/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-git-accent hover:underline font-semibold"
                    >
                      {repo}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// reusable row for prs, issues, comments, reviews
function ActivityRow({
  color,
  bgColor,
  icon,
  label,
  items,
}: {
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  items: { title: string; url: string; repo: string }[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const itemsToShow = isExpanded ? items : items.slice(0, 4);

  return (
    <div className="relative">
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-start gap-3">
          <span className="relative flex items-center justify-center bg-[#30363d] rounded-full w-8 h-8 z-10 shrink-0 border border-git-border text-white -ml-[33px]" style={{ color }}>
            {/* Inner background hack to emulate github badge */}
            <div className={`absolute inset-[1px] rounded-full ${bgColor} flex items-center justify-center`} style={{ color }}>
                {icon}
            </div>
          </span>
          <div className="flex-1 pt-1">
             <span className="text-sm text-git-text">{label}</span>
          </div>
        </div>

        <div className="ml-1 mt-1 space-y-[6px]">
          {itemsToShow.map((item, idx) => (
            <div key={idx} className="flex flex-col text-sm mb-1 leading-tight">
              <Link
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-git-accent hover:underline truncate"
              >
                {item.title}
              </Link>
              <span className="text-git-muted text-xs opacity-90">{item.repo}</span>
            </div>
          ))}
          {!isExpanded && items.length > 4 && (
            <button
               onClick={() => setIsExpanded(true)}
               className="text-xs text-git-muted hover:text-git-accent font-medium mt-1 inline-flex items-center gap-1"
            >
               <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" className="opacity-70"><path d="m8.177.677 2.896 2.896a.25.25 0 0 1-.177.427H8.75v1.25a.75.75 0 0 1-1.5 0V4H5.104a.25.25 0 0 1-.177-.427L7.823.677a.25.25 0 0 1 .354 0ZM7.25 10.75a.75.75 0 0 1 1.5 0V12h2.146a.25.25 0 0 1 .177.427l-2.896 2.896a.25.25 0 0 1-.354 0l-2.896-2.896A.25.25 0 0 1 5.104 12H7.25v-1.25Zm-5-2a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM6 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 6 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5ZM12 8a.75.75 0 0 1-.75.75h-.5a.75.75 0 0 1 0-1.5h.5A.75.75 0 0 1 12 8Zm2.25.75a.75.75 0 0 0 0-1.5h-.5a.75.75 0 0 0 0 1.5h.5Z"></path></svg>
               Show {items.length - 4} more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}