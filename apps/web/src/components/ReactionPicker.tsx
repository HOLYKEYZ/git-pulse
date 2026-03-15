"use client";

import React, { useState } from 'react';

const EMOJIS = ['👍', '🚀', '❤️', '👀', '🎉', '😕'];

interface ReactionPickerProps {
    postId: string;
    onReact: (emoji: string) => void;
    currentReactions?: { emoji: string; count: number; hasReacted: boolean }[];
}

export default function ReactionPicker({ postId, onReact, currentReactions = [] }: ReactionPickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-git-muted hover:bg-git-bg hover:text-git-text border border-transparent hover:border-git-border transition-all"
            >
                <span>➕</span>
                <span>React</span>
            </button>

            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 z-20" 
                        onClick={() => setIsOpen(false)} 
                    />
                    <div className="absolute bottom-full left-0 mb-2 z-30 flex items-center gap-1 p-1 bg-git-card border border-git-border rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        {EMOJIS.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() => {
                                    onReact(emoji);
                                    setIsOpen(false);
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded hover:bg-git-bg transition-colors text-lg"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {currentReactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {currentReactions.map((r) => (
                        <button
                            key={r.emoji}
                            onClick={() => onReact(r.emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition-colors ${
                                r.hasReacted 
                                    ? 'bg-git-blue/10 border-git-blue/30 text-git-blue' 
                                    : 'bg-git-bg border-git-border text-git-muted hover:border-git-muted'
                            }`}
                        >
                            <span>{r.emoji}</span>
                            <span>{r.count}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
