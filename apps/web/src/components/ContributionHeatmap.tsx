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
    FIRST_QUARTILE: "#0e4429",
    SECOND_QUARTILE: "#006d32",
    THIRD_QUARTILE: "#26a641",
    FOURTH_QUARTILE: "#39d353",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ContributionHeatmap({ weeks, totalContributions }: ContributionHeatmapProps) {
    // Calculate month label positions from weeks data
    const monthPositions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, i) => {
        // Look for the first day in this week that starts a new month
        let monthStartDay = week.contributionDays.find(day => {
            const dateObj = new Date(day.date);
            return dateObj.getDate() >= 1 && dateObj.getDate() <= 7;
        });
        
        // If this week contains the start of a month, or we just rely on the first day
        const dayToCheck = monthStartDay || week.contributionDays[0];
        if (dayToCheck) {
            const month = new Date(dayToCheck.date).getMonth();
            // Ensure we don't push the same month twice, and only mark when month changes
            if (month !== lastMonth && i > 0) { // skip very first week to avoid squishing
                monthPositions.push({ label: MONTH_LABELS[month], col: i });
                lastMonth = month;
            } else if (lastMonth === -1) {
                lastMonth = month;
                // If it's the very first column, maybe label it if it's the start
                if (new Date(dayToCheck.date).getDate() < 14) {
                    monthPositions.push({ label: MONTH_LABELS[month], col: i });
                }
            }
        }
    });

    return (
        <div className="w-full max-w-full animate-fade-in relative">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-normal text-git-text">
                    {totalContributions.toLocaleString()} contributions in the last year
                </h2>
            </div>
            
            <div className="rounded-xl border border-git-border bg-git-card p-3 sm:p-4 shadow-sm w-full max-w-full overflow-hidden">
                {/* Scrollable Container so the graph isn't squished */}
                <div className="overflow-x-auto pb-4 custom-scrollbar max-w-full touch-pan-x snap-x snap-mandatory scroll-smooth">
                <div className="inline-flex flex-col min-w-max pt-8 px-4">
                    {/* Month labels row */}
                    <div className="relative h-[15px] mb-1 pl-6">
                        {monthPositions.map((m, i) => (
                            <span
                                key={i}
                                className="absolute text-[10px] text-git-muted"
                                style={{ left: 32 + (m.col * 14) }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>

                    {/* Grid: day labels + heatmap cells */}
                    <div className="flex items-start">
                        {/* Day labels column */}
                        <div className="flex flex-col shrink-0 mr-2 w-6" style={{ gap: 3 }}>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Mon</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Wed</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Fri</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                        </div>

                        {/* Scrollable heatmap grid */}
                        <div className="flex" style={{ gap: 3 }}>
                            {weeks.map((week, w) => {
                                // Calculate empty days needed at the TOP of the first column
                                const firstDayWeekday = week.contributionDays.length > 0 ? week.contributionDays[0].weekday : 0;
                                const emptyPrefixDays = w === 0 ? firstDayWeekday : 0;
                                
                                return (
                                    <div key={w} className="flex flex-col shrink-0" style={{ gap: 3 }}>
                                        {/* Blank squares for days before the year start (if first week) */}
                                        {Array.from({ length: emptyPrefixDays }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-[11px] h-[11px] bg-transparent" />
                                        ))}

                                        {week.contributionDays.map((day) => (
                                            <div
                                                key={day.date}
                                                className="rounded-[2px] transition-shadow cursor-default group relative"
                                                style={{
                                                    width: 11,
                                                    height: 11,
                                                    backgroundColor: LEVEL_COLORS[day.contributionLevel],
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2.5 py-1.5 bg-git-muted text-git-bg text-[11px] font-medium leading-tight whitespace-nowrap rounded shadow-lg pointer-events-none">
                                                    {day.contributionCount === 0 ? "No" : day.contributionCount} contribution{day.contributionCount !== 1 ? "s" : ""} on {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    {/* Tooltip caret */}
                                                    <svg className="absolute text-git-muted h-1.5 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end text-[10px] text-git-muted gap-1">
                <span className="mr-1">Less</span>
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
        </div>
    );
}
