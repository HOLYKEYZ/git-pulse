import React from 'react';
import Link from 'next/link';

const LANGUAGE_COLORS: Record<string, string> = {
    TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
    Rust: "#dea584", Go: "#00ADD8", Shell: "#89e051",
    HTML: "#e34c26", CSS: "#563d7c", Java: "#b07219",
    "C++": "#f34b7d", C: "#555555", Ruby: "#701516",
    Kotlin: "#A97BFF", Swift: "#F05138", Dart: "#00B4AB",
};

interface RepoCardProps {
    name: string;
    description: string;
    language: string;
    languageColor: string;
    stars: number;
    forks: number;
    lastPush: string;
    url?: string;
}

export default function RepoCard({
    name,
    description,
    language,
    languageColor,
    stars,
    forks,
    lastPush,
    url,
}: RepoCardProps) {
    const resolvedColor = languageColor || LANGUAGE_COLORS[language] || "#8b949e";

    const CardContent = (
        <>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-git-blue font-semibold text-sm hover:underline break-words break-all truncate">
                    {name}
                </h3>
                <span className="rounded-full border border-git-border px-2 py-0.5 text-[10px] text-git-muted font-medium whitespace-nowrap ml-2">
                    Public
                </span>
            </div>

            <p className="text-xs text-git-muted mb-3 flex-1 line-clamp-2 leading-relaxed">
                {description}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-git-muted mt-auto">
                {language && (
                    <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: resolvedColor }} />
                        <span>{language}</span>
                    </div>
                )}
                {stars > 0 && (
                    <div className="flex items-center gap-1 hover:text-git-blue">
                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current w-3 h-3">
                            <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/>
                        </svg>
                        <span>{stars.toLocaleString()}</span>
                    </div>
                )}
                {forks > 0 && (
                    <div className="flex items-center gap-1 hover:text-git-blue">
                        <svg height="16" viewBox="0 0 16 16" width="16" className="fill-current w-3 h-3">
                            <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878A2.25 2.25 0 1 1 12.5 8v1.25a2.25 2.25 0 0 1-2.25 2.25h-1.5v1.128a2.251 2.251 0 1 1-1.5 0V10.25H5.75A2.25 2.25 0 0 1 3.5 8V5.372a2.25 2.25 0 1 1 1.5 0ZM11 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm-8 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm5.5 12a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z"/>
                        </svg>
                        <span>{forks.toLocaleString()}</span>
                    </div>
                )}
                <div className="ml-auto">Updated {lastPush}</div>
            </div>
        </>
    );

    if (url) {
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col rounded-lg border border-git-border bg-git-card p-4 hover:border-git-muted transition-all"
            >
                {CardContent}
            </a>
        );
    }

    return (
        <div className="flex flex-col rounded-lg border border-git-border bg-git-card p-4 hover:border-git-muted transition-all cursor-pointer">
            {CardContent}
        </div>
    );
}
