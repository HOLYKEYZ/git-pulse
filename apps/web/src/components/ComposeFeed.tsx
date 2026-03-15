"use client";

import React, { useState } from 'react';

export default function ComposeFeed() {
  const [content, setContent] = useState('');
  const maxLength = 280;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || content.length > maxLength || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type: 'standard' }),
      });

      if (res.ok) {
        setContent('');
        // Refresh the page to show new post
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create post", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-git-border bg-git-card overflow-hidden">
      <div className="bg-[#0d1117] border-b border-git-border px-4 py-2 flex gap-4 text-sm font-medium">
        <button className="text-git-text border-b-2 border-[#f78166] pb-1 -mb-2">Write</button>
        <button className="text-git-muted hover:text-git-text pb-1 -mb-2 transition-colors">Preview</button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 bg-[#0d1117]">
        <textarea
          placeholder="What's happening? (Supports Markdown)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[100px] resize-y bg-git-bg text-git-text font-mono text-sm p-3 rounded-md border border-git-border focus:outline-none focus:ring-2 focus:ring-git-blue focus:border-transparent placeholder:text-git-muted custom-scrollbar"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-git-muted">
            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" className="fill-current">
              <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5h-3.32Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
            </svg>
            <span>Markdown supported</span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono ${content.length > maxLength ? 'text-[#f85149]' : 'text-git-muted'}`}>
              {content.length}/{maxLength}
            </span>
            <button
              type="submit"
              disabled={!content.trim() || content.length > maxLength}
              className="rounded-md bg-git-green px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2ea043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:bg-[#238636] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Comment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
