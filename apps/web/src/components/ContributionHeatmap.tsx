"use client";

import React from "react";
import type { ContributionDay, ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
    weeks: ContributionWeek[];
    totalContributions: number;
}

// Inline hex colors — NOT Tailwind classes — so they survive JIT purge
const LEVEL_COLORS: Record<ContributionDay["contributionLevel"], string> = {
    NONE: "#161b22",
    FIRST_QUARTER: "#0e4429",
    SECOND_QUARTER: "#006d32",
    THIRD_QUARTER: "#26a641",
    FOURTH_QUARTER: "#39d353",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ContributionHeatmap({ weeks, totalContributions }: ContributionHeatmapProps) {
    // Calculate month label positions from weeks data
    const monthPositions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
        const firstDay = week.contributionDays[0];
        if (firstDay) {
            const month = new Date(firstDay.date).getMonth();
            if (month !== lastMonth) {
                monthPositions.push({ label: MONTH_LABELS[month], col: i });
                lastMonth = month;
            }
        }
    });

    return (
        <div className="w-full overflow-hidden rounded-xl border border-git-border bg-git-card p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-git-text">
                    {totalContributions.toLocaleString()} contributions in the last year
                </h2>
            </div>

            {/* Month labels row */}
            <div className="relative h-[15px] mb-1" style={{ marginLeft: 32 }}>
                {monthPositions.map((m, i) => (
                    <span
                        key={i}
                        className="absolute text-[10px] text-git-muted"
                        style={{ left: m.col * 14 }}
                    >
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Grid: day labels + heatmap cells */}
            <div className="flex items-start">
                {/* Day labels column */}
                <div className="flex flex-col shrink-0 mr-1" style={{ gap: 3 }}>
                    <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Mon</span>
                    <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Wed</span>
                    <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Fri</span>
                    <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                </div>

                {/* Scrollable heatmap grid */}
                <div className="flex overflow-x-auto pb-2 custom-scrollbar" style={{ gap: 3 }}>
                    {weeks.map((week, w) => (
                        <div key={w} className="flex flex-col shrink-0" style={{ gap: 3 }}>
                            {week.contributionDays.map((day) => (
                                <div
                                    key={day.date}
                                    className="rounded-[2px] hover:ring-1 hover:ring-git-blue transition-shadow cursor-default"
                                    style={{
                                        width: 11,
                                        height: 11,
                                        backgroundColor: LEVEL_COLORS[day.contributionLevel],
                                    }}
                                    title={`${day.contributionCount} contribution${day.contributionCount !== 1 ? "s" : ""} on ${new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-end text-[10px] text-git-muted gap-1">
                <span>Less</span>
                {(Object.values(LEVEL_COLORS)).map((color, i) => (
                    <div
                        key={i}
                        className="rounded-[2px]"
                        style={{ width: 11, height: 11, backgroundColor: color }}
                    />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
