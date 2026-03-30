"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Comment {
    id: string;
    content: string;
    author: {
        username: string;
        avatar: string;
    };
    timestamp: string;
}

interface CommentSectionProps {
    postId: string;
    initialComments?: Comment[];
}

export default function CommentSection({ postId, initialComments = [] }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });

            if (res.ok) {
                const data = await res.json();
                setComments([
                    ...comments,
                    {
                        id: data.comment.id,
                        content: data.comment.content,
                        author: {
                            username: data.comment.author.username,
                            avatar: data.comment.author.avatar || '/default-avatar.png',
                        },
                        timestamp: 'Just now',
                    }
                ]);
                setNewComment("");
            }
        } catch (error) {
            console.error("Failed to post comment", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mt-4 pt-4 border-t border-git-border space-y-4">
            <h4 className="text-xs font-semibold text-git-muted uppercase tracking-wider">Comments</h4>
            
        <div className="space-y-4">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                    <Link href={`/profile/${comment.author.username}`} className="shrink-0">
                        <Image
                            src={comment.author.avatar}
                            alt={comment.author.username}
                            width={24}
                            height={24}
                            className="rounded-full h-6 w-6 border border-git-border hover:opacity-80 transition-opacity"
                        />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                            <Link href={`/profile/${comment.author.username}`}>
                                <span className="text-xs font-bold text-git-text hover:text-git-accent transition-colors">
                                    {comment.author.username}
                                </span>
                            </Link>
                            <span className="text-[10px] text-git-muted">{comment.timestamp}</span>
                        </div>
                        <p className="text-sm text-git-text leading-relaxed">{comment.content}</p>
                    </div>
                </div>
            ))}
        </div>

            <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-git-bg border border-git-border rounded-md px-3 py-1.5 text-sm text-git-text focus:outline-none focus:ring-1 focus:ring-git-border transition-all"
                />
                <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-4 py-1.5 bg-git-card border border-git-border rounded-md text-xs font-semibold text-git-text hover:bg-git-bg disabled:opacity-50 transition-colors"
                >
                    {isSubmitting ? '...' : 'Post'}
                </button>
            </form>
        </div>
    );
}
