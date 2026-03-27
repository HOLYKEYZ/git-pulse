import React from 'react';
import { getLanguageColor } from '@/lib/colors';
import { isValidHttpUrl, formatRelativeTime } from '@/lib/utils';
import { StarIcon, RepoForkedIcon } from '@primer/octicons-react';

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
    const resolvedColor = languageColor || getLanguageColor(language);

const formattedLastPush = formatRelativeTime(new Date(lastPush));
    const CardContent = (
        <>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#2f81f7] font-semibold text-[15px] hover:underline break-words break-all truncate">
                    {name}
                </h3>
                <span className="rounded-full border border-git-border/60 px-2.5 py-0.5 text-[10px] text-git-muted font-medium whitespace-nowrap ml-2 bg-[#161b22]/50">
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
                    <div className="flex items-center gap-1 hover:text-git-accent">
                        <StarIcon size={16} className="fill-current w-3 h-3" />
                        <span>{stars.toLocaleString()}</span>
                    </div>
                )}
                {forks > 0 && (
                    <div className="flex items-center gap-1 hover:text-git-accent">
                        <RepoForkedIcon size={16} className="fill-current w-3 h-3" />
                        <span>{forks.toLocaleString()}</span>
                    </div>
                )}
                <div className="ml-auto">Updated {formattedLastPush}</div>
            </div>
        </>
    );

const safeUrl = url && isValidHttpUrl(url) ? url : undefined;

if (safeUrl) {
        return (
            <a
                href={safeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col h-full rounded-xl border border-white/5 bg-[#0d1117]/80 hover:bg-[#161b22] hover:border-white/10 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-sm"
            >
                {CardContent}
            </a>
        );
    }

    return (
        <div className="flex flex-col h-full rounded-xl border border-white/5 bg-[#0d1117]/80 hover:bg-[#161b22] hover:border-white/10 p-5 shadow-sm hover:shadow-md transition-all backdrop-blur-sm cursor-pointer">
            {CardContent}
        </div>
    );
}
