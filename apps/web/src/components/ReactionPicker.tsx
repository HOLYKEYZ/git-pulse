"use client";

import React, { useState } from 'react';

// using a standard star icon mechanics similar to x's love icon
interface ReactionPickerProps {
  postId: string;
  onReact: (emoji: string) => void;
  currentReactions?: {emoji: string;count: number;hasReacted: boolean;}[];
}

export default function ReactionPicker({ postId, onReact, currentReactions = [] }: ReactionPickerProps) {
  const starReaction = currentReactions.find((r) => r.emoji === '⭐');
  const isStarred = starReaction?.hasReacted || false;
  const starCount = starReaction?.count || 0;

  // add visual feedback
  const [isAnimating, setIsAnimating] = useState(false);

  const handleStar = () => {
    setIsAnimating(true);
    onReact('⭐');
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleStar}
className={`flex items-center gap-1.5 transition-colors group ${
      isStarred ? 'text-star-active' : 'text-git-muted hover:text-star-active'}
      }
      title="Star">
      
            <div className={`relative flex items-center justify-center ${isAnimating ? 'scale-125 transition-transform duration-200' : 'transition-transform duration-200'}`}>
                <svg aria-hidden="true" height="16" viewBox="0 0 16 16" width="16" className={`fill-current group-hover:bg-star-active/10 rounded pb-0.5 px-0.5 ${isStarred ? '' : 'opacity-80'}`}>
                    {isStarred ?
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" /> :

          <path d="M8 1.75a.75.75 0 0 0-.673.418L5.307 5.06l-3.89.565a.75.75 0 0 0-.416 1.279l2.814 2.742-.664 3.876a.75.75 0 0 0 1.088.791L8 12.347l3.473 1.827a.75.75 0 0 0 1.088-.79l-.664-3.876 2.814-2.742a.75.75 0 0 0-.416-1.28l-3.89-.565-1.882-3.815A.75.75 0 0 0 8 1.75ZM4.264 6.15l-.794-.115L2.21 4.75l1.625-3.292L4.264 6.15Zm3.736-4.4L9.736 6.15l.794.115 1.26-.183-1.625 3.292L8 12.347l-1.625-3.292-1.625 3.292 1.26.183.794-.115L8 1.75Z" />
          }
                </svg>
            </div>
            {starCount > 0 && <span className="text-xs">{starCount}</span>}
        </button>);

}