"use client";

import React from "react";
import type { UserStats } from "@/lib/github";

interface AchievementsProps {
    stats: UserStats;
}

/**
 * GitHub-style achievements, calculated from user stats.
 * Thresholds match GitHub's actual badge system.
 */
interface Achievement {
    name: string;
    description: string;
    tier: number; // 0 = none, 1 = bronze, 2 = silver, 3 = gold
    tierLabel: string;
    icon: string; // Emoji fallback
    color: string;
}

function calculateAchievements(stats: UserStats): Achievement[] {
    const achievements: Achievement[] = [];

    // Pull Shark: Merged PRs
    if (stats.mergedPRs >= 2) {
        const tier = stats.mergedPRs >= 128 ? 3 : stats.mergedPRs >= 16 ? 2 : 1;
        achievements.push({
            name: "Pull Shark",
            description: `${stats.mergedPRs} pull requests merged`,
            tier,
            tierLabel: tier > 1 ? `x${tier === 3 ? 3 : 2}` : "",
            icon: "🦈",
            color: tier === 3 ? "#ffd700" : tier === 2 ? "#c0c0c0" : "#cd7f32",
        });
    }

    // Starstruck: Repos with many stars
    const maxStarRepo = stats.starredRepos.reduce(
        (max, r) => (r.stars > max.stars ? r : max),
        { name: "", stars: 0 }
    );
    if (maxStarRepo.stars >= 16) {
        const tier = maxStarRepo.stars >= 512 ? 3 : maxStarRepo.stars >= 128 ? 2 : 1;
        achievements.push({
            name: "Starstruck",
            description: `Created a repository with ${maxStarRepo.stars} stars`,
            tier,
            tierLabel: tier > 1 ? `x${tier === 3 ? 3 : 2}` : "",
            icon: "🌟",
            color: tier === 3 ? "#ffd700" : tier === 2 ? "#c0c0c0" : "#cd7f32",
        });
    }

    // Pair Extraordinaire: Contributed to other repos
    if (stats.contributedToRepos >= 1) {
        const tier = stats.contributedToRepos >= 64 ? 3 : stats.contributedToRepos >= 10 ? 2 : 1;
        achievements.push({
            name: "Pair Extraordinaire",
            description: `Contributed to ${stats.contributedToRepos} repositories`,
            tier,
            tierLabel: tier > 1 ? `x${tier === 3 ? 3 : 2}` : "",
            icon: "👥",
            color: tier === 3 ? "#ffd700" : tier === 2 ? "#c0c0c0" : "#cd7f32",
        });
    }

    // Arctic Code Vault: Just check if they have repos
    if (stats.totalRepos >= 1) {
        achievements.push({
            name: "Arctic Code Vault",
            description: "Contributed to the 2020 GitHub Archive Program",
            tier: 1,
            tierLabel: "",
            icon: "🏔️",
            color: "#58a6ff",
        });
    }

    return achievements;
}

export default function Achievements({ stats }: AchievementsProps) {
    const achievements = calculateAchievements(stats);

    if (achievements.length === 0) return null;

    return (
        <div className="animate-fade-in">
            <h2 className="text-sm font-semibold text-git-text mb-3">Achievements</h2>
            <div className="flex flex-wrap gap-2">
                {achievements.map((ach) => (
                    <div
                        key={ach.name}
                        className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border border-git-border bg-git-card hover:border-git-muted transition-colors cursor-default"
                    >
                        <span className="text-xl">{ach.icon}</span>
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-git-text">{ach.name}</span>
                            {ach.tierLabel && (
                                <span
                                    className="text-[10px] font-bold"
                                    style={{ color: ach.color }}
                                >
                                    {ach.tierLabel}
                                </span>
                            )}
                        </div>

                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg bg-[#1c2128] border border-git-border text-[11px] text-git-muted whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg z-10">
                            {ach.description}
                        </div>
                    </div>
                ))}
            </div>

            {/* Organizations */}
            {stats.organizations.length > 0 && (
                <div className="mt-4">
                    <h2 className="text-sm font-semibold text-git-text mb-3">Organizations</h2>
                    <div className="flex flex-wrap gap-2">
                        {stats.organizations.map((org) => (
                            <a
                                key={org.login}
                                href={`https://github.com/${org.login}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative"
                                title={org.name || org.login}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={org.avatarUrl}
                                    alt={org.login}
                                    width={32}
                                    height={32}
                                    className="rounded-md border border-git-border hover:border-git-muted transition-colors"
                                />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
