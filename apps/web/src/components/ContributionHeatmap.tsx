"use client";

import React from "react";
import type { ContributionDay, ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
    weeks: ContributionWeek[];
    totalContributions: number;
}

const LEVEL_COLORS: Record<ContributionDay["contributionLevel"], string> = {
    NONE: "bg-[#161b22]",
    FIRST_QUARTER: "bg-[#0e4429]",
    SECOND_QUARTER: "bg-[#006d32]",
    THIRD_QUARTER: "bg-[#26a641]",
    FOURTH_QUARTER: "bg-[#39d353]",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ContributionHeatmap({ weeks, totalContributions }: ContributionHeatmapProps) {
    // Calculate month labels from the actual week data
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
                <h2 className="text-sm font-medium text-git-text">
                    {totalContributions.toLocaleString()} contributions in the last year
                </h2>
            </div>

            {/* Month labels */}
            <div className="flex gap-[3px] mb-1 ml-8 overflow-hidden">
                {monthPositions.map((m, i) => (
                    <span
                        key={i}
                        className="text-[10px] text-git-muted"
                        style={{ marginLeft: i === 0 ? 0 : `${(m.col - (monthPositions[i - 1]?.col ?? 0) - 1) * 13}px` }}
                    >
                        {m.label}
                    </span>
                ))}
            </div>

            {/* Heatmap grid */}
            <div className="flex items-start gap-[1px]">
                {/* Day labels */}
                <div className="flex flex-col gap-[3px] mr-1 shrink-0 pt-[2px]">
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">&nbsp;</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Mon</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">&nbsp;</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Wed</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">&nbsp;</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">Fri</span>
                    <span className="text-[10px] text-git-muted h-[11px] leading-[11px]">&nbsp;</span>
                </div>

                <div className="flex gap-[3px] overflow-x-auto pb-1 custom-scrollbar">
                    {weeks.map((week, w) => (
                        <div key={w} className="flex flex-col gap-[3px] shrink-0">
                            {week.contributionDays.map((day) => (
                                <div
                                    key={day.date}
                                    className={`w-[11px] h-[11px] rounded-[2px] ${LEVEL_COLORS[day.contributionLevel]} hover:ring-1 hover:ring-git-blue transition-all cursor-default`}
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
                {(Object.keys(LEVEL_COLORS) as ContributionDay["contributionLevel"][]).map((level) => (
                    <div key={level} className={`w-[11px] h-[11px] rounded-[2px] ${LEVEL_COLORS[level]}`} />
                ))}
                <span>More</span>
            </div>
        </div>
    );
}
