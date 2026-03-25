"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RepoPushIcon, GitPullRequestIcon, IssueOpenedIcon, CommentIcon, EyeIcon, RepoIcon, UnfoldIcon } from "@primer/octicons-react";
import type { MonthlyActivity } from "@/lib/github";

interface ContributionActivityProps {
  activity: MonthlyActivity[];
}

export default function ContributionActivity({ activity }: ContributionActivityProps) {
  if (!activity || activity.length === 0) return null;

  return (
    <div className="w-full animate-fade-in relative">
      <h2 className="text-base font-normal text-git-text mb-2">Contribution activity</h2>

      <div className="relative">
        {activity.map((month) => (
          <MonthSection key={month.month} month={month} />
        ))}
      </div>
    </div>
  );
}

// ── timeline icon circle — matches github's outlined style ──
function TimelineIcon({ icon, className }: { icon: React.ReactNode; className?: string }) {
  return (
    <div className={`absolute -left-[25px] top-0 flex items-center justify-center w-[32px] h-[32px] rounded-full border-[2px] border-[#0d1117] bg-[#161b22] z-10 text-[#8b949e] ${className || ""}`}>
      {icon}
    </div>
  );
}

// ── expand/collapse toggle ──
function ExpandButton({ count, expanded, onClick }: { count: number; expanded: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-git-muted hover:text-git-accent font-medium mt-2 flex items-center gap-1"
    >
      <UnfoldIcon size={16} className="opacity-70" />
      {expanded ? "Show less" : `Show ${count} more`}
    </button>
  );
}

function MonthSection({ month }: { month: MonthlyActivity }) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggle = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maxCommits = Math.max(...(month.commitRepos?.map((r) => r.count) || [1]), 1);

  const hasContent =
    month.commits > 0 ||
    month.totalPrsOpened > 0 ||
    month.totalIssuesOpened > 0 ||
    month.totalPrReviews > 0 ||
    month.totalReposCreated > 0;

  if (!hasContent) return null;

  return (
    <div className="mb-0">
      {/* month header — github style: bold text + horizontal line */}
      <div className="flex items-center gap-3 mt-6 first:mt-0 mb-4">
        <span className="text-sm font-bold text-git-text whitespace-nowrap">{month.month}</span>
        <div className="h-px bg-[#30363d] flex-1" />
      </div>

      {/* timeline track */}
      <div className="relative ml-[15px] pl-[28px] border-l-[2px] border-[#30363d] pb-2">

        {/* ── commits ── */}
        {month.commits > 0 && Array.isArray(month.commitRepos) && (
          <div className="relative pb-6">
            <TimelineIcon icon={<RepoPushIcon size={16} />} />
            <div className="pt-1">
              <span className="text-sm text-git-text">
                Created{" "}
                <strong>{month.commits.toLocaleString()}</strong>{" "}
                commit{month.commits !== 1 ? "s" : ""} in{" "}
                <strong>{month.commitRepos.length}</strong>{" "}
                repositor{month.commitRepos.length !== 1 ? "ies" : "y"}
              </span>

              {/* repo breakdown with progress bars */}
              <div className="mt-3 space-y-3">
                {month.commitRepos
                  .slice(0, expandedSections["commits"] ? undefined : 4)
                  .map((repo) => (
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
                        {repo.count} {repo.count === 1 ? "commit" : "commits"}
                      </span>
                    </div>
                  ))}
                {month.commitRepos.length > 4 && (
                  <ExpandButton
                    count={month.commitRepos.length - 4}
                    expanded={!!expandedSections["commits"]}
                    onClick={() => toggle("commits")}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── repos created ── */}
        {month.totalReposCreated > 0 && (
          <div className="relative pb-6">
            <TimelineIcon icon={<RepoIcon size={16} />} />
            <div className="pt-1">
              <span className="text-sm text-git-text">
                Created <strong>{month.totalReposCreated.toLocaleString()}</strong>{" "}
                repositor{month.totalReposCreated !== 1 ? "ies" : "y"}
              </span>
              <div className="mt-2 space-y-2">
                {month.reposCreated.map((repo) => (
                  <Link
                    key={repo}
                    href={`https://github.com/${repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-sm text-git-accent hover:underline"
                  >
                    {repo}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── pull requests opened ── */}
        {month.totalPrsOpened > 0 && (
          <ActivityRow
            sectionKey="prs"
            icon={<GitPullRequestIcon size={16} />}
            label={
              <>
                Opened <strong>{month.totalPrsOpened.toLocaleString()}</strong> pull request{month.totalPrsOpened !== 1 ? "s" : ""} in{" "}
                <strong>{month.totalPrRepos.toLocaleString()}</strong>{" "}
                repositor{month.totalPrRepos !== 1 ? "ies" : "y"}
              </>
            }
            items={month.prsOpened}
            expanded={!!expandedSections["prs"]}
            onToggle={() => toggle("prs")}
          />
        )}

        {/* ── issues opened ── */}
        {month.totalIssuesOpened > 0 && (
          <ActivityRow
            sectionKey="issues"
            icon={<IssueOpenedIcon size={16} />}
            label={
              <>
                Opened <strong>{month.totalIssuesOpened.toLocaleString()}</strong> issue{month.totalIssuesOpened !== 1 ? "s" : ""} in{" "}
                <strong>{month.totalIssueRepos.toLocaleString()}</strong>{" "}
                repositor{month.totalIssueRepos !== 1 ? "ies" : "y"}
              </>
            }
            items={month.issuesOpened}
            expanded={!!expandedSections["issues"]}
            onToggle={() => toggle("issues")}
          />
        )}

        {/* ── reviews ── */}
        {month.totalPrReviews > 0 && (
          <ActivityRow
            sectionKey="reviews"
            icon={<EyeIcon size={16} />}
            label={
              <>
                Reviewed <strong>{month.totalPrReviews.toLocaleString()}</strong> pull request{month.totalPrReviews !== 1 ? "s" : ""} in{" "}
                <strong>{month.totalReviewRepos.toLocaleString()}</strong>{" "}
                repositor{month.totalReviewRepos !== 1 ? "ies" : "y"}
              </>
            }
            items={month.prReviews}
            expanded={!!expandedSections["reviews"]}
            onToggle={() => toggle("reviews")}
          />
        )}
      </div>
    </div>
  );
}

// ── reusable row for prs, issues, comments, reviews ──
function ActivityRow({
  sectionKey,
  icon,
  label,
  items,
  expanded,
  onToggle,
}: {
  sectionKey: string;
  icon: React.ReactNode;
  label: React.ReactNode;
  items: { title: string; url: string; repo: string }[];
  expanded: boolean;
  onToggle: () => void;
}) {
  const itemsToShow = expanded ? items : items.slice(0, 4);

  return (
    <div className="relative pb-6">
      <TimelineIcon icon={icon} />
      <div className="pt-1">
        <span className="text-sm text-git-text">{label}</span>

        <div className="mt-3 space-y-3">
          {itemsToShow.map((item, idx) => (
            <div key={idx} className="flex flex-col leading-snug">
              <Link
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-git-text hover:text-git-accent truncate"
              >
                {item.title}
              </Link>
              <span className="text-git-muted text-xs mt-0.5">{item.repo}</span>
            </div>
          ))}
          {items.length > 4 && (
            <ExpandButton
              count={items.length - 4}
              expanded={expanded}
              onClick={onToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
}