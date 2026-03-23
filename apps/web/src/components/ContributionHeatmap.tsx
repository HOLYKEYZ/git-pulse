"use client";

import React, { useEffect, useRef } from "react";
import type { ContributionDay, ContributionWeek } from "@/lib/github";

interface ContributionHeatmapProps {
    weeks: ContributionWeek[];
    totalContributions: number;
}

// inline hex colors — not tailwind classes — so they survive jit purge
const LEVEL_COLORS: Record<ContributionDay["contributionLevel"], string> = {
    NONE: "#161b22",
    FIRST_QUARTILE: "#0e4429",
    SECOND_QUARTILE: "#006d32",
    THIRD_QUARTILE: "#26a641",
    FOURTH_QUARTILE: "#39d353",
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ContributionHeatmap({ weeks, totalContributions }: ContributionHeatmapProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    // auto-scroll to the right (most recent) on mount
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, []);

    // calculate month label positions from weeks data
    const monthPositions: { label: string; col: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, i) => {
        const monthStartDay = week.contributionDays.find(day => {
            const dateObj = new Date(day.date);
            return dateObj.getDate() >= 1 && dateObj.getDate() <= 7;
        });
        
        const dayToCheck = monthStartDay || week.contributionDays[0];
        if (dayToCheck) {
            const month = new Date(dayToCheck.date).getMonth();
            if (month !== lastMonth && i > 0) {
                monthPositions.push({ label: MONTH_LABELS[month], col: i });
                lastMonth = month;
            } else if (lastMonth === -1) {
                lastMonth = month;
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
                {/* scrollable container — auto-scrolled to recent on mount */}
                <div
                    ref={scrollRef}
                    className="overflow-x-auto pb-2 custom-scrollbar max-w-full"
                    style={{ scrollBehavior: "auto" }}
                >
                <div className="inline-flex flex-col min-w-max pt-8 px-4">
                    {/* month labels row */}
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

                    {/* grid: day labels + heatmap cells */}
                    <div className="flex items-start">
                        {/* day labels column */}
                        <div className="flex flex-col shrink-0 mr-2 w-6" style={{ gap: 3 }}>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Mon</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Wed</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">T</span>
                            <span className="text-[10px] text-git-muted h-[11px] leading-[11px] text-right">Fri</span>
                            <span className="text-[10px] text-transparent h-[11px] leading-[11px]">S</span>
                        </div>

                        {/* heatmap grid */}
                        <div className="flex" style={{ gap: 3 }}>
                            {weeks.map((week, w) => {
                                const firstDayWeekday = week.contributionDays.length > 0 ? week.contributionDays[0].weekday : 0;
                                const emptyPrefixDays = w === 0 ? firstDayWeekday : 0;
                                
                                return (
                                    <div key={w} className="flex flex-col shrink-0" style={{ gap: 3 }}>
                                        {Array.from({ length: emptyPrefixDays }).map((_, i) => (
                                            <div key={`empty-${i}`} className="w-[11px] h-[11px] bg-transparent" />
                                        ))}

                                        {week.contributionDays.map((day) => (
                                            <div
                                                key={day.date}
                                                className="rounded-[2px] cursor-default group relative"
                                                style={{
                                                    width: 11,
                                                    height: 11,
                                                    backgroundColor: LEVEL_COLORS[day.contributionLevel],
                                                }}
                                            >
                                                {/* tooltip — positioned above with overflow visible */}
                                                <div className="absolute hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 z-[100] px-2.5 py-1.5 bg-[#24292f] text-white text-[11px] font-medium leading-tight whitespace-nowrap rounded shadow-lg pointer-events-none">
                                                    {day.contributionCount === 0 ? "No" : day.contributionCount} contribution{day.contributionCount !== 1 ? "s" : ""} on {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    <svg className="absolute text-[#24292f] h-1.5 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve"><polygon className="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
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

            <div className="flex justify-between items-center w-full mt-3 px-2">
                <a href="#" className="text-xs text-git-muted hover:text-git-accent hover:underline">
                    Learn how we count contributions
                </a>
                <div className="flex items-center gap-1.5 text-xs text-git-muted">
                    <span>Less</span>
                    <div className="flex gap-[3px]">
                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#161b22] border border-[#1b232d]" />
                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#0e4429] border border-[#115533]" />
                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#006d32] border border-[#00823c]" />
                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#26a641] border border-[#29b748]" />
                        <div className="w-[11px] h-[11px] rounded-[2px] bg-[#39d353] border border-[#3ee05a]" />
                    </div>
                    <span>More</span>
                </div>
            </div>
            </div>
        </div>
    );
}
